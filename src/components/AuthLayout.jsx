import React from "react";
import { AlertTriangle, X } from "lucide-react";

// Toggle this flag to show/hide the maintenance banner on Login & Register pages
const SHOW_MAINTENANCE_BANNER = true;

function MaintenanceBanner({ onDismiss }) {
  return (
    <div
      className="flex items-start gap-3 mb-6 px-4 py-3 rounded-lg relative"
      style={{
        background: "rgba(239, 100, 24, 0.12)",
        border: "1px solid rgba(239, 100, 24, 0.30)",
        borderLeft: "4px solid #EF6418",
      }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF6418" }} strokeWidth={1.5} />
      <p
        className="text-[13px] leading-[1.4] font-medium pr-6"
        style={{ color: "#F5E6DF" }}
      >
        Services may be temporarily unavailable starting Saturday, September 26.
        Rentals will be disabled during maintenance while we improve the experience.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        className="absolute top-2 right-2 p-1 rounded transition-colors hover:bg-white/10"
        style={{ color: "#A0A0A0" }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const [bannerVisible, setBannerVisible] = React.useState(SHOW_MAINTENANCE_BANNER);

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap');
      .auth-layout, .auth-layout * { font-family: 'Albert Sans', system-ui, -apple-system, sans-serif !important; }
    `}</style>
    <div
      className="auth-layout min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(180,60,0,0.45) 0%, rgba(100,30,0,0.25) 40%, #000000 75%)",
        backgroundColor: "#000000"
      }}>
      
      {/* Logo above card */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/6b060a1ae_ember-tv-logo.png"
          alt="Ember TV"
          className="h-16 w-auto mb-3" />
        
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "#232323", border: "1px solid #2e2e2e" }}>
        
        {/* Maintenance Banner */}
        {bannerVisible && <MaintenanceBanner onDismiss={() => setBannerVisible(false)} />}

        {/* Icon */}
        <div className="flex justify-center mb-5">
          








          
        </div>

        {/* Title & subtitle */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-gray-400 mt-1 text-sm">{subtitle}</p>}
        </div>

        {children}

        {footer &&
        <p className="text-center text-sm text-gray-500 mt-6">{footer}</p>
        }
      </div>
    </div>
    </>
  );
}