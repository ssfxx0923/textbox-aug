'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Admin {
  id: string;
  username: string;
}

interface CardKey {
  id: string;
  tenant_url: string;
  access_token: string;
  email: string;
  balance_url?: string;
  expiry_date: string;
  query_params: string;
  secure_token: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
}

interface Stats {
  total: number;
  used: number;
  unused: number;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [cardKeys, setCardKeys] = useState<CardKey[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, unused: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const response = await fetch('/api/admin/cardkeys')
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        setCardKeys(data.cardKeys)
        setStats(data.stats)
      } else {
        setIsLoggedIn(false)
      }
    } catch (error) {
      setIsLoggedIn(false)
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsLoggedIn(true)
        setAdmin(data.admin)
        setSuccess('登录成功')
        checkAuthAndLoadData()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('登录失败，请重试')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsLoggedIn(false)
      setAdmin(null)
      setCardKeys([])
      setStats({ total: 0, used: 0, unused: 0 })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('请输入卡密数据')
      return
    }
    
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/admin/cardkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText, single: false })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message)
        setImportText('')
        setShowImport(false)
        checkAuthAndLoadData()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('导入失败，请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个卡密吗？')) return
    
    try {
      const response = await fetch(`/api/admin/cardkeys/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuccess('卡密删除成功')
        checkAuthAndLoadData()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (error) {
      setError('删除失败，请重试')
    }
  }

  const handleMarkUsed = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cardkeys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_used' })
      })
      
      if (response.ok) {
        setSuccess('卡密已标记为已使用')
        checkAuthAndLoadData()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (error) {
      setError('操作失败，请重试')
    }
  }

  const handleRestore = async (id: string) => {
    if (!confirm('确定要恢复这个卡密为未使用状态吗？')) return
    
    try {
      const response = await fetch(`/api/admin/cardkeys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      })
      
      if (response.ok) {
        setSuccess('卡密已恢复为未使用状态')
        checkAuthAndLoadData()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (error) {
      setError('恢复失败，请重试')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('链接已复制到剪贴板')
  }

  const getCardKeyLink = (token: string) => {
    return `${window.location.origin}/key/${token}`
  }

  // 过滤卡密
  const filteredCardKeys = cardKeys.filter(cardKey => {
    if (filterStatus === 'used') return cardKey.is_used
    if (filterStatus === 'unused') return !cardKey.is_used
    return true
  })

  // 导出未使用的卡密链接
  const exportUnusedLinks = () => {
    const unusedCardKeys = cardKeys.filter(cardKey => !cardKey.is_used)
    
    if (unusedCardKeys.length === 0) {
      setError('没有未使用的卡密')
      return
    }

    const links = unusedCardKeys.map(cardKey => getCardKeyLink(cardKey.secure_token))
    const linkText = links.join('\n')
    
    // 创建并下载文件
    const blob = new Blob([linkText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unused-cardkey-links-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setSuccess(`已导出 ${unusedCardKeys.length} 个未使用的卡密链接`)
  }

  // 导出未使用的卡密详细信息
  const exportUnusedDetails = () => {
    const unusedCardKeys = cardKeys.filter(cardKey => !cardKey.is_used)
    
    if (unusedCardKeys.length === 0) {
      setError('没有未使用的卡密')
      return
    }

    const detailsText = unusedCardKeys.map((cardKey, index) => {
      return `=== 卡密 ${index + 1} ===
链接：${getCardKeyLink(cardKey.secure_token)}
租户URL：${cardKey.tenant_url}
访问令牌：${cardKey.access_token}
邮箱：${cardKey.email}
${cardKey.balance_url ? `余额查询URL：${cardKey.balance_url}` : '余额查询URL：'}
实际到期日：${cardKey.expiry_date}
创建时间：${new Date(cardKey.created_at).toLocaleString()}
----------------`
    }).join('\n\n')
    
    // 创建并下载文件
    const blob = new Blob([detailsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unused-cardkey-details-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setSuccess(`已导出 ${unusedCardKeys.length} 个未使用的卡密详细信息`)
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">管理员登录</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                用户名
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                密码
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              登录
            </button>
          </form>
          
          <div className="mt-4 text-sm text-gray-600 text-center">
            默认账号：admin / admin123
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">卡密管理后台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{admin?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 消息提示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">总卡密数</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">已使用</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.used}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold">○</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">未使用</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.unused}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            批量导入卡密
          </button>
          <button
            onClick={() => checkAuthAndLoadData()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            刷新数据
          </button>
          <div className="relative">
            <button
              onClick={exportUnusedLinks}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2"
            >
              导出链接
            </button>
            <button
              onClick={exportUnusedDetails}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              导出详情
            </button>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">筛选状态：</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                全部 ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('unused')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'unused'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                未使用 ({stats.unused})
              </button>
              <button
                onClick={() => setFilterStatus('used')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'used'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                已使用 ({stats.used})
              </button>
            </div>
          </div>
        </div>

        {/* 导入界面 */}
        {showImport && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">批量导入卡密</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴卡密数据，格式如text.txt文件..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
            <div className="mt-4 flex space-x-4">
              <button
                onClick={handleImport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                导入
              </button>
              <button
                onClick={() => {setShowImport(false); setImportText('')}}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 卡密列表 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">卡密列表</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {filterStatus === 'all' && `显示全部 ${filteredCardKeys.length} 个卡密`}
              {filterStatus === 'used' && `显示 ${filteredCardKeys.length} 个已使用的卡密`}
              {filterStatus === 'unused' && `显示 ${filteredCardKeys.length} 个未使用的卡密`}
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredCardKeys.map((cardKey) => (
              <li key={cardKey.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${cardKey.is_used ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {cardKey.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {cardKey.tenant_url}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-4">到期: {cardKey.expiry_date}</span>
                      <span className="mr-4">创建: {new Date(cardKey.created_at).toLocaleString()}</span>
                      {cardKey.is_used && cardKey.used_at && (
                        <span>使用: {new Date(cardKey.used_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(getCardKeyLink(cardKey.secure_token))}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      复制链接
                    </button>
                    {!cardKey.is_used ? (
                      <button
                        onClick={() => handleMarkUsed(cardKey.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                      >
                        标记已用
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(cardKey.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        恢复未用
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(cardKey.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredCardKeys.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {cardKeys.length === 0 ? '暂无卡密数据' : `暂无${filterStatus === 'used' ? '已使用' : filterStatus === 'unused' ? '未使用' : ''}的卡密`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
