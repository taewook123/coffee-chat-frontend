import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard } from 'lucide-react';

const PaymentSection = ({ amount, mentorName, onPaymentSuccess, orderInfo }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. 포트원 결제창 호출 (기존에 설정한 키 사용)
      const response = await window.PortOne.requestPayment({
        storeId: "store-여기에_상점고유코드_입력",
        channelKey: "channel-key-여기에_채널키_입력",
        paymentId: orderInfo.orderId,
        orderName: `${mentorName} 커피챗 예약`,
        totalAmount: amount,
        currency: "CURRENCY_KRW",
        payMethod: "EASY_PAY",
      });

      if (response.code != null) throw new Error(response.message);

      // 2. 백엔드 검증 호출
      const verifyRes = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payment/verify`, {
        paymentId: response.paymentId,
        orderId: orderInfo.orderId,
        amount: amount
      });

      if (verifyRes.status === 200) {
        onPaymentSuccess(); // 예약 최종 생성 로직 실행
      }
    } catch (err) {
      alert("결제 처리 중 문제가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
    >
      {isProcessing ? "결제 처리 중..." : `${amount.toLocaleString()}원 결제하고 예약하기`}
    </button>
  );
};

export default PaymentSection;