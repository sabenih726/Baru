// Utility functions for localStorage operations

export interface Product {
  id: string
  name: string
  price: number
  stock?: number
}

export interface TransactionItem {
  name: string
  price: number
  quantity: number
}

export interface Transaction {
  id: string
  date: string
  items: TransactionItem[]
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
}

// Default products
export const defaultProducts: Product[] = [
  { id: "1", name: "Roti Tawar", price: 12000 },
  { id: "2", name: "Roti Coklat", price: 15000 },
  { id: "3", name: "Roti Keju", price: 18000 },
  { id: "4", name: "Croissant", price: 25000 },
  { id: "5", name: "Donat Gula", price: 8000 },
  { id: "6", name: "Donat Coklat", price: 10000 },
  { id: "7", name: "Roti Pisang", price: 13000 },
  { id: "8", name: "Roti Abon", price: 16000 },
]

// Generate unique transaction ID
export const generateTransactionId = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${timestamp}${random}`
}

// Products operations
export const getProducts = (): Product[] => {
  try {
    const products = localStorage.getItem("products")
    if (products) {
      return JSON.parse(products)
    } else {
      // Initialize with default products
      localStorage.setItem("products", JSON.stringify(defaultProducts))
      return defaultProducts
    }
  } catch (error) {
    console.error("Error loading products:", error)
    return defaultProducts
  }
}

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem("products", JSON.stringify(products))
  } catch (error) {
    console.error("Error saving products:", error)
  }
}

export const addProduct = (product: Omit<Product, "id">): Product => {
  const products = getProducts()
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
  }
  products.push(newProduct)
  saveProducts(products)
  return newProduct
}

export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) return null

  products[index] = { ...products[index], ...updates }
  saveProducts(products)
  return products[index]
}

export const deleteProduct = (id: string): boolean => {
  const products = getProducts()
  const filteredProducts = products.filter((p) => p.id !== id)
  if (filteredProducts.length === products.length) return false

  saveProducts(filteredProducts)
  return true
}

// Transactions operations
export const getTransactions = (): Transaction[] => {
  try {
    const transactions = localStorage.getItem("transactions")
    const parsedTransactions = transactions ? JSON.parse(transactions) : []

    // Remove duplicates based on ID
    const uniqueTransactions = parsedTransactions.filter(
      (transaction: Transaction, index: number, self: Transaction[]) =>
        index === self.findIndex((t) => t.id === transaction.id),
    )

    // If duplicates were found, save the cleaned data
    if (uniqueTransactions.length !== parsedTransactions.length) {
      localStorage.setItem("transactions", JSON.stringify(uniqueTransactions))
    }

    return uniqueTransactions
  } catch (error) {
    console.error("Error loading transactions:", error)
    return []
  }
}

export const saveTransaction = (transaction: Transaction): void => {
  try {
    const transactions = getTransactions()

    // Check if transaction with same ID already exists
    const existingIndex = transactions.findIndex((t) => t.id === transaction.id)

    if (existingIndex >= 0) {
      // Update existing transaction instead of adding duplicate
      transactions[existingIndex] = transaction
      console.log("Updated existing transaction:", transaction.id)
    } else {
      // Add new transaction
      transactions.push(transaction)
      console.log("Added new transaction:", transaction.id)
    }

    localStorage.setItem("transactions", JSON.stringify(transactions))
  } catch (error) {
    console.error("Error saving transaction:", error)
  }
}

export const getTransactionById = (id: string): Transaction | null => {
  const transactions = getTransactions()
  return transactions.find((t) => t.id === id) || null
}

// Statistics
export const getTodayStats = () => {
  const transactions = getTransactions()
  const today = new Date().toDateString()

  const todayTransactions = transactions.filter((t) => new Date(t.date).toDateString() === today)

  const totalSales = todayTransactions.reduce((sum, t) => sum + t.total, 0)

  return {
    totalSales,
    totalTransactions: todayTransactions.length,
    transactions: todayTransactions,
  }
}

// Analytics functions
export const getDailyStats = (date?: Date) => {
  const targetDate = date || new Date()
  const dateString = targetDate.toDateString()
  
  const transactions = getTransactions()
  const todayTransactions = transactions.filter(
    (t) => new Date(t.date).toDateString() === dateString
  )

  const totalSales = todayTransactions.reduce((sum, t) => sum + t.total, 0)

  return {
    totalSales,
    totalTransactions: todayTransactions.length,
    transactions: todayTransactions,
  }
}

export const getProductAnalytics = () => {
  const transactions = getTransactions()
  const productSales: { [key: string]: { quantity: number; revenue: number } } = {}
  
  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      if (!productSales[item.name]) {
        productSales[item.name] = { quantity: 0, revenue: 0 }
      }
      productSales[item.name].quantity += item.quantity
      productSales[item.name].revenue += item.price * item.quantity
    })
  })
  
  return productSales
}

export const getWeeklyStats = () => {
  const transactions = getTransactions()
  const weekStats: { [key: string]: number } = {}
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toDateString()
    
    const dayTransactions = transactions.filter(
      (t) => new Date(t.date).toDateString() === dateString
    )
    
    weekStats[dateString] = dayTransactions.reduce((sum, t) => sum + t.total, 0)
  }
  
  return weekStats
}

// Data management
export const exportData = () => {
  const data = {
    products: getProducts(),
    transactions: getTransactions(),
    exportDate: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `kasir-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.products && Array.isArray(data.products)) {
          saveProducts(data.products)
        }

        if (data.transactions && Array.isArray(data.transactions)) {
          localStorage.setItem("transactions", JSON.stringify(data.transactions))
        }

        resolve(true)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

// Clear all data
export const clearAllData = (): void => {
  localStorage.removeItem("products")
  localStorage.removeItem("transactions")
}

// Clean up duplicates (utility function)
export const cleanupDuplicateTransactions = (): number => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  const uniqueTransactions = transactions.filter(
    (transaction: Transaction, index: number, self: Transaction[]) =>
      index === self.findIndex((t) => t.id === transaction.id),
  )

  const duplicatesRemoved = transactions.length - uniqueTransactions.length

  if (duplicatesRemoved > 0) {
    localStorage.setItem("transactions", JSON.stringify(uniqueTransactions))
  }

  return duplicatesRemoved
}
