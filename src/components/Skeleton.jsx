import React from 'react';
import './Skeleton.css';

export const SkeletonLine = ({ width = '100%', height = '16px', style = {} }) => (
  <div className="skeleton-line" style={{ width, height, ...style }} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="skeleton-card">
    <div className="skeleton-header" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={i === lines - 1 ? '65%' : '100%'} />
    ))}
  </div>
);

export const BookingPageSkeleton = () => (
  <div className="booking-page skeleton-wrapper">
    <div className="booking-header">
      <div className="skeleton-line" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
      <div className="skeleton-line" style={{ width: '140px', height: '24px', marginLeft: '12px' }} />
    </div>
    <div className="skeleton-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="skeleton-line" style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="60%" height="20px" style={{ marginBottom: '8px' }} />
          <SkeletonLine width="40%" height="14px" />
        </div>
      </div>
    </div>
    <div className="skeleton-card">
      <SkeletonLine width="40%" height="18px" style={{ marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-line" style={{ width: '48px', height: '52px', borderRadius: '10px' }} />
        ))}
      </div>
    </div>
    <div className="skeleton-card">
      <SkeletonLine width="50%" height="18px" style={{ marginBottom: '12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-line" style={{ height: '44px', borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div style={{ padding: '24px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="skeleton-line" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="70%" height="14px" style={{ marginBottom: '8px' }} />
            <SkeletonLine width="40%" height="22px" />
          </div>
        </div>
      ))}
    </div>
    <div className="skeleton-card">
      <SkeletonLine width="30%" height="22px" style={{ marginBottom: '16px' }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <SkeletonLine width="20%" height="16px" />
          <SkeletonLine width="25%" height="16px" />
          <SkeletonLine width="20%" height="16px" />
          <SkeletonLine width="15%" height="16px" />
          <SkeletonLine width="20%" height="16px" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonCard;
