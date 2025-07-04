"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  Plus,
  Settings
} from "lucide-react"
import Link from "next/link"
import { getTransactions, getProducts, getDailyStats } from "@/lib/localStorage"

interface Transaction {
  id: string
  date: string
  total: number
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  paymentMethod: string
}

interface Product {
  id: string
  name: string
  price: number
  stock?: number
}

export default function Dashboard() {
  const [todaySales, setTodaySales] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [lowStockProducts, setLowStockProducts] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [yesterdaySales, setYesterdaySales] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    try {
      const transactions = getTransactions()
      const products = getProducts()
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      // Today's data
      const todayTxns = transactions.filter((t: Transaction) => 
        new Date(t.date).toDateString() === today
      )

      // Yesterday's data for comparison
      const yesterdayTxns = transactions.filter((t: Transaction) => 
        new Date(t.date).toDateString() === yesterday
      )

      const totalSales = todayTxns.reduce((sum: number, t: Transaction) => sum + t.total, 0)
      const yesterdayTotal = yesterdayTxns.reduce((sum: number, t: Transaction) => sum + t.total, 0)

      // Product analytics
      const productSales: { [key: string]: number } = {}
      transactions.forEach((t: Transaction) => {
        t.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity
        })
      })

      const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }))

      // Low stock products
      const lowStock = products.filter((p: Product) => 
        p.stock !== undefined && p.stock < 10
      ).length

      setTodaySales(totalSales)
      setYesterdaySales(yesterdayTotal)
      setTodayTransactions(todayTxns.length)
      setTotalProducts(products.length)
      setLowStockProducts(lowStock)
      setRecentTransactions(transactions.slice(-5).reverse())
      setTopProducts(sortedProducts)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesGrowth = calculateGrowth(todaySales, yesterdaySales)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Kasir</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString("id-ID", { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/transaksi">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Transaksi Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Penjualan Hari Ini</p>
                  <p className="text-2xl font-bold">{formatCurrency(todaySales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {salesGrowth >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {Math.abs(salesGrowth).toFixed(1)}% dari kemarin
                    </span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Transaksi</p>
                  <p className="text-2xl font-bold">{todayTransactions}</p>
                  <p className="text-xs text-blue-200">transaksi hari ini</p>
                </div>
                <Receipt className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Produk</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                  <p className="text-xs text-purple-200">item tersedia</p>
                </div>
                <Package className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Stok Menipis</p>
                  <p className="text-2xl font-bold">{lowStockProducts}</p>
                  <p className="text-xs text-orange-200">perlu restok</p>
                </div>
                <TrendingUp className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Transaksi Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Belum ada transaksi hari ini</p>
                  <Link href="/transaksi" className="mt-4 inline-block">
                    <Button>Buat Transaksi Pertama</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{transaction.id.slice(-6)}</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.paymentMethod}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleTimeString("id-ID")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.items.length} item
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-green-600">
                            {formatCurrency(transaction.total)}
                          </p>
                          <Link href={`/struk/${transaction.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Produk Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Belum ada penjualan</p>
                </div>
              ) : (
                <div className="divide-y">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {product.quantity} terjual
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/transaksi">
                <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                  <ShoppingCart className="h-6 w-6" />
                  <span>Transaksi Baru</span>
                </Button>
              </Link>
              <Link href="/produk">
                <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                  <Package className="h-6 w-6" />
                  <span>Kelola Produk</span>
                </Button>
              </Link>
              <Link href="/riwayat">
                <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                  <Receipt className="h-6 w-6" />
                  <span>Riwayat</span>
                </Button>
              </Link>
              <Link href="/pengaturan">
                <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                  <Settings className="h-6 w-6" />
                  <span>Pengaturan</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}