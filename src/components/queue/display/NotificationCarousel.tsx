
import React, { useState, useEffect } from 'react';
import { getActiveNotifications } from '@/services/notificationService';
import { Notification } from '@/lib/types';

const NotificationCarousel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await getActiveNotifications();
        setNotifications(data);
        setError(null);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError('Error al cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle notification rotation
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const currentNotification = notifications[currentIndex];
    const intervalTime = currentNotification.intervalInSeconds * 1000;
    
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === notifications.length - 1 ? 0 : prevIndex + 1
      );
    }, intervalTime);
    
    return () => clearTimeout(timer);
  }, [currentIndex, notifications]);
  
  if (loading) {
    return (
      <div className="p-4 bg-white shadow rounded">
        <div className="animate-pulse flex flex-col items-center justify-center h-48">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-white shadow rounded">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return null; // Don't show anything if there are no notifications
  }
  
  const currentNotification = notifications[currentIndex];
  
  const renderNotificationContent = () => {
    switch (currentNotification.type) {
      case 'text':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{currentNotification.title}</h2>
            <p className="text-lg whitespace-pre-line">{currentNotification.content}</p>
          </div>
        );
      
      case 'image':
        return (
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">{currentNotification.title}</h2>
            <div className="flex justify-center">
              <img 
                src={currentNotification.imageUrl} 
                alt={currentNotification.title} 
                className="max-h-[400px] object-contain rounded-lg"
              />
            </div>
            {currentNotification.content && (
              <p className="mt-4 text-lg">{currentNotification.content}</p>
            )}
          </div>
        );
      
      case 'youtube': {
        const videoId = currentNotification.youtubeUrl?.includes('youtube.com/watch?v=')
          ? currentNotification.youtubeUrl.split('v=')[1]?.split('&')[0]
          : currentNotification.youtubeUrl?.includes('youtu.be/')
            ? currentNotification.youtubeUrl.split('youtu.be/')[1]
            : '';
            
        return (
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">{currentNotification.title}</h2>
            {videoId && (
              <div className="aspect-video mx-auto max-w-4xl">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            {currentNotification.content && (
              <p className="mt-4 text-lg">{currentNotification.content}</p>
            )}
          </div>
        );
      }
      
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white shadow rounded overflow-hidden transition-all duration-500 ease-in-out">
      {renderNotificationContent()}
      
      {notifications.length > 1 && (
        <div className="flex justify-center pb-2">
          {notifications.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-ocular-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCarousel;
