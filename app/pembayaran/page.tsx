
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Smartphone, Banknote, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getTransactions, type Transaction } from "@/lib/localStorage"

interface PaymentStatus {
  id: string
  amount: number
  method: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: string
  transactionId?: string
}

export default function PembayaranPage() {
  const [payments, setPayments] = useState<PaymentStatus[]>([])
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaymentData()
    const interval = setInterval(loadPaymentData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadPaymentData = () => {
    // Load transactions from localStorage
    const transactions = getTransactions()
    const today = new Date().toDateString()
    const todayTrans = transactions.filter(t => new Date(t.date).toDateString() === today)
    
    setTodayTransactions(todayTrans)
    
    // Simulate payment statuses
    const paymentStatuses: PaymentStatus[] = todayTrans.map(t => ({
      id: t.id,
      amount: t.total,
      method: t.paymentMethod,
      status: 'completed',
      timestamp: t.date,
      transactionId: t.id
    }))
    
    setPayments(paymentStatuses)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'qris':
        return <Smartphone className="h-4 w-4" />
      case 'transfer':
        return <CreditCard className="h-4 w-4" />
      case 'tunai':
        return <Banknote className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalByMethod = (method: string) => {
    return payments
      .filter(p => p.method === method && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getTotalToday = () => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Monitor Pembayaran</h1>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalToday())}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">QRIS</p>
                  <p className="text-xl font-bold">{formatCurrency(getTotalByMethod('qris'))}</p>
                </div>
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transfer</p>
                  <p className="text-xl font-bold">{formatCurrency(getTotalByMethod('transfer'))}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tunai</p>
                  <p className="text-xl font-bold">{formatCurrency(getTotalByMethod('tunai'))}</p>
                </div>
                <Banknote className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Memuat data pembayaran...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Belum ada pembayaran hari ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.method)}
                      <div>
                        <p className="font-medium">#{payment.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.timestamp).toLocaleTimeString("id-ID")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600 capitalize">{payment.method}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status === 'completed' ? 'Berhasil' : 
                           payment.status === 'pending' ? 'Menunggu' : 'Gagal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Cara Menerima Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">QRIS</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Customer scan QR code yang ditampilkan di halaman transaksi dan bayar melalui aplikasi e-wallet
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <h3 className="font-medium">Transfer Bank</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Customer scan QR code atau transfer manual ke rekening yang tertera
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Tunai</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Terima uang tunai dari customer, masukkan jumlah uang yang diterima untuk menghitung kembalian
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
