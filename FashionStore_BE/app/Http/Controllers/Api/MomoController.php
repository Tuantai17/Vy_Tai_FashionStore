<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Payment;

class MomoController extends Controller
{
    /**
     * Tạo giao dịch MoMo và trả payUrl cho FE.
     */
    public function create(Request $req)
    {
        // ===== 1) Validate =====
        $v = Validator::make($req->all(), [
            'amount' => ['required', 'numeric', 'min:1000'],
            'method' => ['nullable', 'in:momo_wallet,payWithATM'],
        ], [
            'amount.min' => 'Số tiền phải từ 1.000đ trở lên.',
        ]);

        if ($v->fails()) {
            return response()->json(['message' => $v->errors()->first()], 422);
        }

        // ===== 2) Lấy config từ services.php / .env =====
        $cfg         = config('services.momo');
        $endpoint    = $cfg['endpoint'];
        $partnerCode = $cfg['partner_code'];
        $accessKey   = $cfg['access_key'];
        $secretKey   = $cfg['secret_key'];
        $redirectUrl = $cfg['redirect_url'];
        $ipnUrl      = $cfg['ipn_url'];

        // ===== 3) Chuẩn hoá dữ liệu =====
        $amount      = (int) $req->input('amount');               // VND
        $method      = $req->input('method', 'momo_wallet');
        $requestType = $method === 'payWithATM'
            ? 'payWithATM'
            : ($cfg['request_type'] ?? 'captureWallet');         // ví MoMo

        $orderId   = (string) (time() . rand(1000, 9999));
        $requestId = (string) (time() . rand(100, 999));
        $orderInfo = "Thanh toán qua MoMo - {$method}";

        // ===== 4) Tạo chữ ký =====
        $rawHash = "accessKey={$accessKey}"
            . "&amount={$amount}"
            . "&extraData="
            . "&ipnUrl={$ipnUrl}"
            . "&orderId={$orderId}"
            . "&orderInfo={$orderInfo}"
            . "&partnerCode={$partnerCode}"
            . "&redirectUrl={$redirectUrl}"
            . "&requestId={$requestId}"
            . "&requestType={$requestType}";

        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        // ===== 5) Payload gửi MoMo =====
        $payload = [
            'partnerCode' => $partnerCode,
            'partnerName' => 'FashionStore',
            'storeId'     => 'FashionStore',
            'requestId'   => $requestId,
            'amount'      => (string) $amount,     // theo doc là string
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl'      => $ipnUrl,
            'lang'        => 'vi',
            'extraData'   => '',
            'requestType' => $requestType,
            'signature'   => $signature,
        ];

        // ===== 6) Gọi MoMo (cURL) =====
        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        // Tối ưu network – giảm lỗi 502/timeout trên 1 số ISP
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);

        // DEV/local: có thể cần tắt verify SSL (đừng dùng trên production)
        if (app()->environment('local')) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        }

        $result = curl_exec($ch);
        if ($result === false) {
            $err = curl_error($ch);
            curl_close($ch);
            Log::error('MoMo create cURL error', ['error' => $err]);
            return response()->json(['message' => 'Không kết nối được MoMo: ' . $err], 502);
        }
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($result, true) ?: [];

        // ===== 7) Lưu payment tạm =====
        Payment::create([
            'order_id'     => $orderId,
            'request_id'   => $requestId,
            'amount'       => $amount,
            'partner_code' => $partnerCode,
            'method'       => $method,
            'raw'          => $json,
            'result_code'  => $json['resultCode'] ?? null,
            'message'      => $json['message'] ?? null,
        ]);

        if ($httpCode >= 400) {
            Log::error('MoMo create failed', ['status' => $httpCode, 'body' => $json]);
            return response()->json(['message' => $json['message'] ?? 'MoMo từ chối yêu cầu.'], 400);
        }

        // ===== 8) Trả về payUrl cho FE redirect =====
        return response()->json([
            'payUrl'    => $json['payUrl']   ?? null,
            'deeplink'  => $json['deeplink'] ?? null,
            'orderId'   => $orderId,
            'requestId' => $requestId,
        ]);
    }

    /**
     * IPN/Callback từ MoMo.
     */
    public function callback(Request $req)
    {
        $cfg       = config('services.momo');
        $accessKey = $cfg['access_key'];
        $secretKey = $cfg['secret_key'];

        $data         = $req->all();
        $incomingSign = $data['signature'] ?? '';

        // Build raw string check chữ ký (theo doc)
        $raw = "accessKey={$accessKey}"
            . "&amount="       . ($data['amount']       ?? '')
            . "&extraData="    . ($data['extraData']    ?? '')
            . "&message="      . ($data['message']      ?? '')
            . "&orderId="      . ($data['orderId']      ?? '')
            . "&orderInfo="    . ($data['orderInfo']    ?? '')
            . "&orderType="    . ($data['orderType']    ?? '')
            . "&partnerCode="  . ($data['partnerCode']  ?? '')
            . "&payType="      . ($data['payType']      ?? '')
            . "&requestId="    . ($data['requestId']    ?? '')
            . "&responseTime=" . ($data['responseTime'] ?? '')
            . "&resultCode="   . ($data['resultCode']   ?? '')
            . "&transId="      . ($data['transId']      ?? '');

        $calcSign = hash_hmac('sha256', $raw, $secretKey);
        if ($incomingSign !== $calcSign) {
            Log::warning('MoMo callback signature mismatch', ['data' => $data]);
        }

        // Lưu / cập nhật payment theo orderId
        $p = Payment::firstOrCreate(['order_id' => $data['orderId'] ?? ''], []);
        $p->update([
            'request_id'  => $data['requestId'] ?? $p->request_id,
            'amount'      => isset($data['amount']) ? (int)$data['amount'] : $p->amount,
            'trans_id'    => $data['transId'] ?? $p->trans_id,
            'result_code' => isset($data['resultCode']) ? (int)$data['resultCode'] : $p->result_code,
            'message'     => $data['message'] ?? $p->message,
            'raw'         => $data,
        ]);

        // TODO: cập nhật trạng thái đơn hàng của bạn tại đây.

        return response('OK', 200);
    }

    /**
     * Trang người dùng quay lại sau thanh toán
     */
    public function return(Request $req)
    {
        return response()->json([
            'resultCode' => (int) $req->query('resultCode', -1),
            'message'    => (string) $req->query('message', 'Unknown'),
            'orderId'    => $req->query('orderId'),
            'transId'    => $req->query('transId'),
        ]);
    }
}
