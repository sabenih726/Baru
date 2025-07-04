"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, QrCode } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProducts, saveTransaction, generateTransactionId, type Product } from "@/lib/localStorage"
import { QRCodeSVG } from 'qrcode.react'

interface CartItem extends Product {
  quantity: number
  subtotal: number
}

const defaultProducts: Product[] = [
  { id: "1", name: "Roti Tawar", price: 12000 },
  { id: "2", name: "Roti Coklat", price: 15000 },
  { id: "3", name: "Roti Keju", price: 18000 },
  { id: "4", name: "Croissant", price: 25000 },
  { id: "5", name: "Donat Gula", price: 8000 },
  { id: "6", name: "Donat Coklat", price: 10000 },
  { id: "7", name: "Roti Pisang", price: 13000 },
  { id: "8", name: "Roti Abon", price: 16000 },
]

export default function TransaksiPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("tunai")
  const [cashReceived, setCashReceived] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    // Load products from localStorage
    const savedProducts = localStorage.getItem("products")
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    } else {
      localStorage.setItem("products", JSON.stringify(defaultProducts))
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    const data = getProducts()
    setProducts(data)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const addToCart = () => {
    if (!selectedProduct) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const existingItem = cart.find((item) => item.id === selectedProduct)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity,
          subtotal: product.price * quantity,
        },
      ])
    }

    setSelectedProduct("")
    setQuantity(1)
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price } : item,
      ),
    )
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  const getChange = () => {
    const cash = Number.parseFloat(cashReceived) || 0
    return cash - getTotalAmount()
  }

  const generatePaymentQR = () => {
    const transactionId = Date.now().toString().slice(-8)
    const amount = getTotalAmount()
    
    // Load payment settings
    const savedSettings = localStorage.getItem("paymentSettings")
    const settings = savedSettings ? JSON.parse(savedSettings) : null
    
    if (paymentMethod === "qris") {
      if (settings && settings.qrisMerchantId) {
        // Format QRIS resmi sesuai standar ISO 20022
        const merchantId = settings.qrisMerchantId
        const merchantName = settings.qrisMerchantName || "Toko Roti Bahagia"
        
        // Format QRIS resmi untuk GoPay
        // Ini adalah format standar yang dapat dibaca oleh semua aplikasi e-wallet
        return `00020101021226580014ID.CO.QRIS.WWW${merchantId.length.toString().padStart(2, '0')}${merchantId}52044814530336054${amount.toString().padStart(10, '0').slice(-10)}5802ID5913${merchantName}6006JAKARTA62070503${transactionId}6304`
      } else {
        // Fallback jika belum ada Merchant ID
        return `QRIS:DEMO:${transactionId}:${amount}:${cart.map(item => `${item.name}x${item.quantity}`).join(',')}`
      }
    } else {
      // Format transfer bank
      const bankName = settings?.bankName || "BCA"
      const accountNumber = settings?.accountNumber || "1234567890"
      return `TRANSFER:${bankName}:${accountNumber}:${amount}:${transactionId}:Toko Roti Bahagia`
    }
  }

  const processTransaction = async () => {
    if (cart.length === 0) return

    if (paymentMethod === "tunai" && getChange() < 0) {
      alert("Uang yang diterima kurang!")
      return
    }

    setProcessing(true)

    try {
      const transactionId = generateTransactionId()

      const transaction = {
        id: transactionId,
        date: new Date().toISOString(),
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: getTotalAmount(),
        paymentMethod,
        cashReceived: paymentMethod === "tunai" ? Number.parseFloat(cashReceived) : getTotalAmount(),
        change: paymentMethod === "tunai" ? getChange() : 0,
      }

      // Save transaction (hanya sekali)
      console.log("Saving transaction:", transactionId)
      saveTransaction(transaction)
      console.log("Transaction saved successfully")

      // Redirect to receipt page
      router.push(`/struk/${transactionId}`)
    } catch (error) {
      console.error("Error processing transaction:", error)
      alert("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setProcessing(false)
    }
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
          <h1 className="text-2xl font-bold">Transaksi Baru</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Pilih Produk</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih roti..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="text-center w-20"
                    min="1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={addToCart} className="w-full" disabled={!selectedProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah ke Keranjang
              </Button>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Keranjang masih kosong</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(getTotalAmount())}</span>
                  </div>

                  <Button onClick={() => setShowPayment(true)} className="w-full" disabled={cart.length === 0}>
                    Lanjut ke Pembayaran
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <Card className="fixed inset-4 z-50 bg-white shadow-lg max-w-md mx-auto my-auto h-fit">
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Total Belanja</Label>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalAmount())}</div>
              </div>

              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={(value) => {
                  setPaymentMethod(value)
                  if (value === "qris" || value === "transfer") {
                    setShowQRCode(true)
                  } else {
                    setShowQRCode(false)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "tunai" && (
                <>
                  <div className="space-y-2">
                    <Label>Uang Diterima</Label>
                    <Input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Masukkan jumlah uang..."
                    />
                  </div>

                  {cashReceived && (
                    <div className="space-y-2">
                      <Label>Kembalian</Label>
                      <div className={`text-xl font-bold ${getChange() >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatCurrency(getChange())}
                      </div>
                    </div>
                  )}
                </>
              )}

              {showQRCode && (paymentMethod === "qris" || paymentMethod === "transfer") && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Label>Scan QR Code untuk Pembayaran</Label>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                      <QRCodeSVG 
                        value={generatePaymentQR()} 
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      {paymentMethod === "qris" ? "Scan dengan aplikasi e-wallet (GoPay, OVO, Dana, dll)" : "Scan untuk transfer bank"}
                    </p>
                    <p className="font-bold text-lg">{formatCurrency(getTotalAmount())}</p>
                    <p className="text-xs text-gray-500">
                      ID Transaksi: #{Date.now().toString().slice(-6)}
                    </p>
                    {paymentMethod === "qris" && (
                      <div className="mt-2">
                        {(() => {
                          const savedSettings = localStorage.getItem("paymentSettings")
                          const settings = savedSettings ? JSON.parse(savedSettings) : null
                          return settings?.qrisMerchantId ? (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ QRIS Resmi Aktif - Merchant: {settings.qrisMerchantName}
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 font-medium">
                              ⚠️ Mode Demo - Silakan set Merchant ID di Pengaturan
                            </p>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Setelah pembayaran berhasil, klik tombol "Selesai" untuk mencetak struk
                    </p>
                    {paymentMethod === "qris" && (
                      <p className="text-xs text-blue-600 mt-1">
                        QR code ini dapat di-scan oleh semua aplikasi e-wallet yang mendukung QRIS
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                  className="flex-1"
                  disabled={processing}
                >
                  Batal
                </Button>
                <Button onClick={processTransaction} className="flex-1" disabled={processing}>
                  {processing ? "Memproses..." : "Selesai"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowPayment(false)} />
        )}
      </div>
    </div>
  )
}
