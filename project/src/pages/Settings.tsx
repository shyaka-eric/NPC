import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ORG_NAME_KEY = 'orgName';
const ORG_LOGO_KEY = 'orgLogo';

const Settings: React.FC = () => {
  const [orgName, setOrgName] = useState('NPC Logistics');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem(ORG_NAME_KEY);
    if (savedName) setOrgName(savedName);
    const savedLogo = localStorage.getItem(ORG_LOGO_KEY);
    if (savedLogo) setLogoPreview(savedLogo);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setLogoPreview(ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Save org name
    localStorage.setItem(ORG_NAME_KEY, orgName);
    // Save logo as data URL
    if (logoPreview) {
      localStorage.setItem(ORG_LOGO_KEY, logoPreview);
    }
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved!');
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="System Settings"
        description="Manage global system settings."
      />
      <form onSubmit={handleSave} className="space-y-6 mt-8">
        <Input
          label="Organization Name"
          name="orgName"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organization Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block w-full text-sm text-slate-700"
          />
          {logoPreview && (
            <img src={logoPreview} alt="Logo Preview" className="mt-2 h-16" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Other Settings</label>
          <div className="text-slate-500 text-sm">(Add more global settings here as needed.)</div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" isLoading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings; 