
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, QrCode, Building, CreditCard } from "lucide-react"
import Link from "next/link"

interface PaymentSettings {
  qrisEnabled: boolean
  qrisMerchantId: string
  qrisMerchantName: string
  transferEnabled: boolean
  bankName: string
  accountNumber: string
  accountName: string
  storeInfo: {
    name: string
    address: string
    phone: string
  }
}

export default function PengaturanPage() {
  const [settings, setSettings] = useState<PaymentSettings>({
    qrisEnabled: true,
    qrisMerchantId: "",
    qrisMerchantName: "Toko Roti Bahagia",
    transferEnabled: true,
    bankName: "BCA",
    accountNumber: "1234567890",
    accountName: "Toko Roti Bahagia",
    storeInfo: {
      name: "Toko Roti Bahagia",
      address: "Jl. Raya No. 123, Kota",
      phone: "0812-3456-7890"
    }
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("paymentSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      localStorage.setItem("paymentSettings", JSON.stringify(settings))
      alert("Pengaturan berhasil disimpan!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.')
      const updated = { ...prev }
      let current: any = updated
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return updated
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Pengaturan Pembayaran</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informasi Toko
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Toko</Label>
                <Input
                  value={settings.storeInfo.name}
                  onChange={(e) => updateSettings("storeInfo.name", e.target.value)}
                  placeholder="Nama toko Anda"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea
                  value={settings.storeInfo.address}
                  onChange={(e) => updateSettings("storeInfo.address", e.target.value)}
                  placeholder="Alamat lengkap toko"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  value={settings.storeInfo.phone}
                  onChange={(e) => updateSettings("storeInfo.phone", e.target.value)}
                  placeholder="Nomor telepon toko"
                />
              </div>
            </CardContent>
          </Card>

          {/* QRIS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Pengaturan QRIS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="qris-enabled">Aktifkan QRIS</Label>
                <Switch
                  id="qris-enabled"
                  checked={settings.qrisEnabled}
                  onCheckedChange={(checked) => updateSettings("qrisEnabled", checked)}
                />
              </div>

              {settings.qrisEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Merchant ID QRIS GoPay</Label>
                    <Input
                      value={settings.qrisMerchantId}
                      onChange={(e) => updateSettings("qrisMerchantId", e.target.value)}
                      placeholder="Masukkan Merchant ID dari GoPay..."
                    />
                    <p className="text-xs text-gray-500">
                      Merchant ID QRIS resmi yang Anda dapatkan dari GoPay
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Cara mendapatkan Merchant ID QRIS GoPay:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Buka aplikasi GoBiz (GoPay for Business)</li>
                      <li>2. Masuk ke menu "QRIS" atau "Terima Pembayaran"</li>
                      <li>3. Pilih "QR Statis" atau "QR Dinamis"</li>
                      <li>4. Copy Merchant ID yang ditampilkan</li>
                      <li>5. Paste ke form di atas</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Merchant</Label>
                    <Input
                      value={settings.qrisMerchantName}
                      onChange={(e) => updateSettings("qrisMerchantName", e.target.value)}
                      placeholder="Nama merchant untuk QRIS"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bank Transfer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transfer Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="transfer-enabled">Aktifkan Transfer Bank</Label>
                <Switch
                  id="transfer-enabled"
                  checked={settings.transferEnabled}
                  onCheckedChange={(checked) => updateSettings("transferEnabled", checked)}
                />
              </div>

              {settings.transferEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Nama Bank</Label>
                    <Input
                      value={settings.bankName}
                      onChange={(e) => updateSettings("bankName", e.target.value)}
                      placeholder="BCA, Mandiri, BRI, dll"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nomor Rekening</Label>
                    <Input
                      value={settings.accountNumber}
                      onChange={(e) => updateSettings("accountNumber", e.target.value)}
                      placeholder="Nomor rekening bank"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Pemilik Rekening</Label>
                    <Input
                      value={settings.accountName}
                      onChange={(e) => updateSettings("accountName", e.target.value)}
                      placeholder="Nama sesuai rekening bank"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview QR */}
          <Card>
            <CardHeader>
              <CardTitle>Preview QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Preview QR code yang akan ditampilkan ke pelanggan
              </p>
              <p className="text-xs text-gray-500">
                {settings.qrisEnabled ? "QRIS aktif" : "QRIS tidak aktif"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} className="min-w-32">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
