import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
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
    </div>);

}