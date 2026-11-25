import React, { useEffect, useState } from 'react';
import { X, User as UserIcon, Edit3, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';
import * as api from '../../api/client';

const DEFAULT_PHONE = '8975332899';
const DEFAULT_ADDRESS = 'brickfour, Yerwada';
const DEFAULT_FIRM = 'Brickfour';
const DEFAULT_PROFESSION = 'Legal Executive';

interface ProfileModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
  onPasswordChanged: () => void;
}

/** Password input with a show/hide toggle. */
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Plain required text input used by the edit-profile form. */
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
      />
    </div>
  );
}

function StatusMessage({ success, error }: { success: string; error: string }) {
  return (
    <>
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded font-medium">
          {error}
        </div>
      )}
    </>
  );
}

const tabClass = (active: boolean) =>
  `pb-2 px-3 border-b-2 cursor-pointer transition-all ${active ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`;

export default function ProfileModal({ user, open, onClose, onUserUpdate, onPasswordChanged }: ProfileModalProps) {
  const [profileTab, setProfileTab] = useState<'details' | 'edit' | 'password'>('details');

  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || DEFAULT_PHONE);
  const [editAddress, setEditAddress] = useState(user.address || DEFAULT_ADDRESS);
  const [editFirm, setEditFirm] = useState(user.firmName || DEFAULT_FIRM);
  const [editProfession, setEditProfession] = useState(user.profession || DEFAULT_PROFESSION);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Start every edit session from the current profile
  useEffect(() => {
    if (open) {
      setEditName(user.name);
      setEditPhone(user.phone || DEFAULT_PHONE);
      setEditAddress(user.address || DEFAULT_ADDRESS);
      setEditFirm(user.firmName || DEFAULT_FIRM);
      setEditProfession(user.profession || DEFAULT_PROFESSION);
    }
  }, [open]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const updatedUser = await api.updateProfile({
        name: editName,
        phone: editPhone,
        address: editAddress,
        firmName: editFirm,
        profession: editProfession
      });
      setEditSuccess("Profile updated successfully!");
      onUserUpdate(updatedUser);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.updatePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated successfully! Redirecting to home...");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess('');
        onClose();
        onPasswordChanged();
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 text-amber-600">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-slate-900">User Profile Settings</h3>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button type="button" onClick={() => setProfileTab('details')} className={tabClass(profileTab === 'details')}>
            Profile Details
          </button>
          <button type="button" onClick={() => setProfileTab('edit')} className={tabClass(profileTab === 'edit')}>
            Edit Profile
          </button>
          <button type="button" onClick={() => setProfileTab('password')} className={tabClass(profileTab === 'password')}>
            Update Password
          </button>
        </div>

        {/* Tab 1: Details */}
        {profileTab === 'details' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Full Name:</span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="font-mono text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Profession:</span>
                <span className="font-bold text-slate-900">{user.profession || DEFAULT_PROFESSION}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Firm Name:</span>
                <span className="font-bold text-slate-900">{user.firmName || DEFAULT_FIRM}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phone Number:</span>
                <span className="font-mono text-slate-900">{user.phone || DEFAULT_PHONE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Office Location:</span>
                <span className="text-slate-900">{user.address || 'Brickfour, Pune'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setProfileTab('edit')}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Profile */}
        {profileTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <StatusMessage success={editSuccess} error={editError} />

            <TextField label="Full Name" value={editName} onChange={setEditName} />
            <TextField label="Profession / Title" value={editProfession} onChange={setEditProfession} />
            <TextField label="Firm Name" value={editFirm} onChange={setEditFirm} />
            <TextField label="Phone Number" value={editPhone} onChange={setEditPhone} />
            <TextField label="Address / Location" value={editAddress} onChange={setEditAddress} />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold px-4 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Update Password */}
        {profileTab === 'password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
            <StatusMessage success={passwordSuccess} error={passwordError} />

            <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordField label="New Password (min 6 chars)" value={newPassword} onChange={setNewPassword} />
            <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold px-4 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
