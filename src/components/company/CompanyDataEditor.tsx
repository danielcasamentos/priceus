import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Save, AlertCircle, CheckCircle, PenTool } from 'lucide-react';
import { MaskedInput } from '../MaskedInput';
import { ContractCanvas } from '../ContractCanvas';

interface BusinessSettings {
  person_type: 'fisica' | 'juridica';
  business_name: string;
  cpf: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  signature_base64: string | null;
  signature_created_at: string | null;
}

interface CompanyDataEditorProps {
  userId: string;
}

export function CompanyDataEditor({ userId }: CompanyDataEditorProps) {
  const [settings, setSettings] = useState<BusinessSettings>({
    person_type: 'juridica',
    business_name: '',
    cpf: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    signature_base64: null,
    signature_created_at: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_business_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          person_type: data.person_type || 'juridica',
          business_name: data.business_name || '',
          cpf: data.cpf || '',
          cnpj: data.cnpj || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          phone: data.phone || '',
          email: data.email || '',
          signature_base64: data.signature_base64 || null,
          signature_created_at: data.signature_created_at || null,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (signatureData: string | null) => {
    setSettings({
      ...settings,
      signature_base64: signatureData,
      signature_created_at: signatureData ? new Date().toISOString() : null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('user_business_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('user_business_settings').update(settings).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_business_settings').insert({ user_id: userId, ...settings });
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dados Empresariais</h2>
          <p className="text-sm text-gray-600">Estas informações serão usadas automaticamente nos seus contratos</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pessoa</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" value="fisica" checked={settings.person_type === 'fisica'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, person_type: e.target.value as 'fisica' | 'juridica' })} className="mr-2" />
              <span>Pessoa Física (CPF)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" value="juridica" checked={settings.person_type === 'juridica'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, person_type: e.target.value as 'fisica' | 'juridica' })} className="mr-2" />
              <span>Pessoa Jurídica (CNPJ)</span>
            </label>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">{settings.person_type === 'fisica' ? 'Nome Completo' : 'Nome da Empresa / Razão Social'}</label>
          <input type="text" value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        {settings.person_type === 'fisica' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
            <MaskedInput mask="999.999.999-99" value={settings.cpf} onChange={(e) => setSettings({ ...settings, cpf: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
            <MaskedInput mask="99.999.999/9999-99" value={settings.cnpj} onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
          <MaskedInput mask="(99) 9 9999-9999" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Endereço Completo</label>
          <input type="text" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <input type="text" value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <input type="text" value={settings.state} onChange={(e) => setSettings({ ...settings, state: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" maxLength={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
          <MaskedInput mask="99999-999" value={settings.zip_code} onChange={(e) => setSettings({ ...settings, zip_code: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-3 mb-4">
          <PenTool className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Assinatura Digital</h3>
            <p className="text-sm text-gray-600">Sua assinatura será incluída automaticamente em todos os contratos</p>
          </div>
        </div>
        {settings.signature_base64 ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Assinatura Atual:</p>
              <img src={settings.signature_base64} alt="Assinatura" className="border-2 border-gray-300 rounded bg-white p-4 max-w-md" />
              {settings.signature_created_at && <p className="text-xs text-gray-500 mt-2">Criada em: {new Date(settings.signature_created_at).toLocaleDateString('pt-BR')}</p>}
            </div>
            <button type="button" onClick={() => handleSignatureChange(null)} className="px-4 py-2 text-sm text-red-600 hover:text-red-800">Criar Nova Assinatura</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">Assine no campo abaixo usando o mouse ou toque na tela.</p>
            </div>
            <ContractCanvas onSignatureChange={handleSignatureChange} />
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
          {saving ? 'Salvando...' : <><Save className="w-5 h-5 inline mr-2" />Salvar Configurações</>}
        </button>
      </div>
    </div>
  );
}