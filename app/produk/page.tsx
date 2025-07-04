
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Filter,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  exportData,
  importData,
  type Product,
} from "@/lib/localStorage"

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "low-stock" | "no-stock">("all")
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, filterType])

  const loadProducts = () => {
    setLoading(true)
    try {
      const data = getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply stock filter
    switch (filterType) {
      case "low-stock":
        filtered = filtered.filter(product => 
          product.stock !== undefined && product.stock > 0 && product.stock < 10
        )
        break
      case "no-stock":
        filtered = filtered.filter(product => 
          product.stock !== undefined && product.stock === 0
        )
        break
      default:
        break
    }

    setFilteredProducts(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const productData = {
      name: formData.name,
      price: Number.parseFloat(formData.price),
      stock: formData.stock ? Number.parseInt(formData.stock) : undefined,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
    } else {
      addProduct(productData)
    }

    loadProducts()
    resetForm()
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock?.toString() || "",
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      deleteProduct(id)
      loadProducts()
    }
  }

  const resetForm = () => {
    setFormData({ name: "", price: "", stock: "" })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importData(file)
        .then(() => {
          loadProducts()
          alert("Data berhasil diimpor!")
        })
        .catch((error) => {
          console.error("Import error:", error)
          alert("Gagal mengimpor data!")
        })
    }
  }

  const getStockBadge = (stock?: number) => {
    if (stock === undefined) return null
    if (stock === 0) return <Badge variant="destructive">Habis</Badge>
    if (stock < 10) return <Badge variant="outline" className="text-orange-600 border-orange-300">Menipis</Badge>
    return <Badge variant="secondary" className="text-green-600">Tersedia</Badge>
  }

  const lowStockCount = products.filter(p => p.stock !== undefined && p.stock > 0 && p.stock < 10).length
  const outOfStockCount = products.filter(p => p.stock !== undefined && p.stock === 0).length
  const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kelola Produk</h1>
              <p className="text-gray-600">Manajemen inventori toko</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadProducts} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportData} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <label>
              <Button variant="outline" asChild size="sm">
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </span>
              </Button>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Produk</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Nilai Inventori</p>
                  <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Stok Menipis</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Stok Habis</p>
                  <p className="text-2xl font-bold">{outOfStockCount}</p>
                </div>
                <Package className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  size="sm"
                >
                  Semua
                </Button>
                <Button
                  variant={filterType === "low-stock" ? "default" : "outline"}
                  onClick={() => setFilterType("low-stock")}
                  size="sm"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Menipis
                </Button>
                <Button
                  variant={filterType === "no-stock" ? "default" : "outline"}
                  onClick={() => setFilterType("no-stock")}
                  size="sm"
                >
                  Habis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        {showForm && (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle>{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama produk"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="Masukkan harga"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stok (Opsional)</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="Masukkan stok"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600">
                    {editingProduct ? "Update" : "Tambah"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center justify-between">
              <span>Daftar Produk ({filteredProducts.length} item)</span>
              {searchTerm || filterType !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterType("all")
                  }}
                >
                  Reset Filter
                </Button>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>{products.length === 0 ? "Belum ada produk" : "Tidak ada produk yang sesuai filter"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{product.name}</h3>
                          {getStockBadge(product.stock)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(product.price)}
                          </span>
                          {product.stock !== undefined && (
                            <span>Stok: {product.stock}</span>
                          )}
                          {product.stock !== undefined && (
                            <span className="text-blue-600">
                              Nilai: {formatCurrency(product.price * product.stock)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
