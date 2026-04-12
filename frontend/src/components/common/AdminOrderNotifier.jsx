import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { orderService } from '../../services/orderService';

const STORAGE_KEY = 'admin_last_seen_order_ts';

const AdminOrderNotifier = () => {
  const lastSeenRef = useRef(0);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (error) {
      console.error('Notification sound failed:', error);
    }
  };

  const checkNewOrders = async () => {
    try {
      const response = await orderService.getAllOrders({ page: 1, limit: 20 });
      if (!response?.success || !Array.isArray(response.data) || response.data.length === 0) return;

      const persisted = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (!lastSeenRef.current && persisted > 0) {
        lastSeenRef.current = persisted;
      }

      const latestOrderTs = new Date(response.data[0].createdAt).getTime();

      // First load baseline (no notification)
      if (!lastSeenRef.current) {
        lastSeenRef.current = latestOrderTs;
        localStorage.setItem(STORAGE_KEY, String(latestOrderTs));
        return;
      }

      const newOrders = response.data.filter(
        (order) => new Date(order.createdAt).getTime() > lastSeenRef.current
      );

      if (newOrders.length > 0) {
        lastSeenRef.current = latestOrderTs;
        localStorage.setItem(STORAGE_KEY, String(latestOrderTs));
        playNotificationSound();
        toast.info(`🔔 ${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} placed`);
      }
    } catch (error) {
      console.error('Admin order notifier error:', error);
    }
  };

  useEffect(() => {
    checkNewOrders();
    const intervalId = setInterval(checkNewOrders, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default AdminOrderNotifier;
