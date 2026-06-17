import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard } from 'lucide-react';

const PaymentSection = ({
  amount = 0,
  mentorName = '호스트',
  onPaymentSuccess,
  orderInfo
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const safeAmount = Number(amount) || 0;
  const orderId = orderInfo?.orderId;

  const handlePayment = async () => {
    if (!safeAmount) {
      alert('결제 금액 정보가 없습니다.');
      return;
    }

    if (!orderId) {
      alert('주문 정보가 없습니다. 다시 예약을 진행해주세요.');
      return;
    }

    if (!window.PortOne) {
      alert('포트원 결제 모듈을 불러오지 못했습니다.');
      return;
    }

    setIsProcessing(true);
const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

if (!storeId || !channelKey) {
  alert('포트원 결제 설정값이 없습니다. .env 설정을 확인해주세요.');
  return;
}
    try {
      const response = await window.PortOne.requestPayment({
        storeId: import.meta.env.VITE_PORTONE_STORE_ID,
        channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
        paymentId: orderId,
        orderName: `${mentorName} 티타임 예약`,
        totalAmount: safeAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
      });

      if (response.code != null) {
        throw new Error(response.message);
      }

      const verifyRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/booking/payment/verify`,
        {
          paymentId: response.paymentId,
          orderId,
          amount: safeAmount,
        }
      );

      if (verifyRes.status === 200) {
        onPaymentSuccess?.();
      }
    } catch (err) {
      console.error('결제 처리 실패:', err);
      alert('결제 처리 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isProcessing || !safeAmount}
      className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      <CreditCard className="inline-block w-5 h-5 mr-2" />
      {isProcessing
        ? '결제 처리 중...'
        : `${safeAmount.toLocaleString()}원 결제하고 예약하기`}
    </button>
  );
};

export default PaymentSection;