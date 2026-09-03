import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Badge, Camera, CheckCircle2, Mail } from "lucide-react";
import { OperatorProfile } from "../types";

interface ProfileViewProps {
  profile: OperatorProfile;
  onUpdateProfile: (updated: OperatorProfile) => void;
}

const AVATAR_OPTIONS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGy9qdaP099MffCFFTv58ivQf7bTW3ESUGU5do4rtW6RR_bR6M-ymWlI5xLQrtg9Tdjz8WYHNA983OmxDwhWArkpBc7vJL2ItNxkOTU6SD_kvpo60L72ua_qp-UeSNmce-VFAlqSFZCJcUoX67EdmsDsjYu9tpqq_nvHWhLURlxvNOUQfQFpxjuH7uxaaW8f32meyLGwUOYink-K2VFC_Z5n8SUYKQyuE9QxaLEs7gGxryH03KxI2UfXM5bk-OWbz8gBogCxdNUM",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80"
];

export default function ProfileView({ profile, onUpdateProfile }: ProfileViewProps) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [contact, setContact] = useState(profile.contact);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [upazilla, setUpazilla] = useState(profile.upazilla);
  const [zila, setZila] = useState(profile.zila);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setRole(profile.role);
    setContact(profile.contact);
    setEmail(profile.email);
    setAddress(profile.address);
    setUpazilla(profile.upazilla);
    setZila(profile.zila);
    setAvatar(profile.avatar);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      role,
      contact,
      upazilla,
      zila,
      address,
      email,
      avatar,
    });
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Saved Toast Alert */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-c-green text-on-accent font-bold py-3 px-5 rounded-lg flex items-center gap-2 shadow-2xl transition-all animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-mono text-xs uppercase tracking-wide">Operator metrics synchronized!</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
            Operator Profile & Station Clef
          </h1>
          <p className="text-sm text-ink-muted">
            Inspect credentials, adjust regional station variables, and modify biometric vectors.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-fill border border-hair-strong rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-c-green animate-pulse"></span>
          <span className="font-mono text-xs text-c-green font-bold uppercase tracking-wider">
            Cleared Clearance Level 4
          </span>
        </div>
      </header>

      {/* Split layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left Side fields uploader */}
        <div className="lg:col-span-8 bg-surface border border-hair rounded-xl p-6 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-headline text-base font-semibold text-ink-strong tracking-widest uppercase border-b border-hair pb-2">
              Operator Station Metrics
            </h3>

            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 2: Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Designated Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Badge className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 3: Telephone contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 4: Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 5: Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 6: Upazilla */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Upazilla
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={upazilla}
                    onChange={(e) => setUpazilla(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 7: Zila */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                  Zila
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-ink-muted w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 pl-9 pr-4 text-xs text-ink-strong placeholder-ink-muted/40 focus:border-accent focus:outline-none transition-colors"
                    value={zila}
                    onChange={(e) => setZila(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Profile Avatar Grid choice */}
            <div className="space-y-3 pt-3">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wide block">
                Biometric Face Verification ID
              </label>
              <div className="flex flex-wrap gap-4">
                {AVATAR_OPTIONS.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                      avatar === url ? "border-accent scale-105 shadow-[0_0_12px_rgba(74,222,128,0.35)]" : "border-hair-strong grayscale hover:grayscale-0 hover:border-hair-strong"
                    }`}
                  >
                    <img src={url} alt={`Avatar-${index}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-hair flex justify-end">
              <button
                type="submit"
                className="bg-accent hover:bg-accent text-on-accent font-bold py-2.5 px-6 rounded-lg text-xs transition-all uppercase tracking-wider"
              >
                Commit Profile Metrics
              </button>
            </div>
          </form>
        </div>

        {/* Right Side summary card preview */}
        <div className="lg:col-span-4 bg-surface border border-hair rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-6 pt-2">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 shadow-xl mb-4 group-avatar">
                <img src={avatar} alt="Biometric verification" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-ink-strong" />
                </div>
              </div>

              <h4 className="font-headline text-lg font-bold text-ink-strong tracking-tight">{name}</h4>
              <p className="text-xs text-ink-muted font-mono mt-0.5">{role}</p>

              <span className="mt-3 px-3 py-1 bg-accent/15 border border-accent/20 rounded-full font-mono text-[9px] text-accent font-bold tracking-widest uppercase">
                STATION OVERSEER
              </span>
            </div>

            {/* Static trace metrics details */}
            <div className="border-t border-hair pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Local Area Base</span>
                <span className="font-mono text-ink-strong text-[10px] uppercase font-bold">
                  {upazilla}, {zila}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Mobile Clef ID</span>
                <span className="font-mono text-ink-strong text-[10px] font-bold">{contact}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Email Address</span>
                <span className="font-mono text-ink-strong text-[10px] font-bold">{email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Address</span>
                <span className="font-mono text-ink-strong text-[10px] font-bold">{address}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Hardware Access Node</span>
                <span className="font-mono text-ink-strong text-[10px] text-cyan-400">0x3F8B4 - NODE-SAVAR</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-fill rounded-lg border border-hair flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#4ade80] animate-pulse"></span>
            <span className="font-mono text-[9px] text-ink-muted leading-relaxed">
              Operator signature active on main satellite arrays. Communications encrypted at MIL-SPEC hashes.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
