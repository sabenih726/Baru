"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Receipt, Eye } from "lucide-react"
import Link from "next/link"
import { getTransactions, type Transaction } from "@/lib/localStorage"

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = () => {
    setLoading(true)
    try {
      const data = getTransactions()
      const sortedData = [...data].reverse() // Show newest first
      setTransactions(sortedData)
      setFilteredTransactions(sortedData)
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedDate) {
      filtered = filtered.filter((t) => new Date(t.date).toDateString() === new Date(selectedDate).toDateString())
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, selectedDate, transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const getTotalSales = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.total, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
          </div>
          <div className="text-center py-8">
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan ID atau nama produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {(searchTerm || selectedDate) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter aktif:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm("")}>
                    Pencarian: {searchTerm} ×
                  </Badge>
                )}
                {selectedDate && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedDate("")}>
                    Tanggal: {new Date(selectedDate).toLocaleDateString("id-ID")} ×
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Penjualan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalSales())}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Rata-rata per Transaksi</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.length > 0
                    ? formatCurrency(getTotalSales() / filteredTransactions.length)
                    : formatCurrency(0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Daftar Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada transaksi yang sesuai dengan filter"}
                </p>
                {transactions.length === 0 && (
                  <div className="mt-4">
                    <Link href="/transaksi">
                      <Button>Buat Transaksi Pertama</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">#{transaction.id.slice(-6)}</h3>
                          <Badge variant="outline">{transaction.paymentMethod}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleString("id-ID")}</p>
                        <div className="text-sm text-gray-600">
                          {transaction.items.length} item: {transaction.items.map((item) => item.name).join(", ")}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(transaction.total)}</p>
                        <Link href={`/struk/${transaction.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Struk
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
      </div>
    </div>
  )
}
