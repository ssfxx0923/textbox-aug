'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface CardKey {
  tenant_url: string;
  access_token: string;
  email: string;
  balance_url?: string;
  expiry_date: string;
  query_params: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
}

export default function KeyPage() {
  const params = useParams()
  const token = params.token as string
  const [cardKey, setCardKey] = useState<CardKey | null>(null)
  const [formatted, setFormatted] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    if (token) {
      checkCardKeyStatus()
    }
  }, [token])

  const fetchCardKey = async (confirmUse = false) => {
    try {
      const url = confirmUse ? `/api/key/${token}?confirm=true` : `/api/key/${token}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setCardKey(data.cardKey)
        setFormatted(data.formatted)
        setShowConfirmation(false)
      } else {
        setError(data.error || '卡密不存在或已失效')
      }
    } catch (error) {
      setError('获取卡密失败，请重试')
    }
    setLoading(false)
  }

  const checkCardKeyStatus = async () => {
    try {
      const response = await fetch(`/api/key/${token}?check=true`)
      const data = await response.json()
      
      if (response.ok) {
        if (data.cardKey.is_used) {
          // 已使用，直接显示信息
          setCardKey(data.cardKey)
          setFormatted(data.formatted)
        } else {
          // 未使用，显示确认界面
          setShowConfirmation(true)
          setCardKey(data.cardKey) // 保存卡密信息但不显示
        }
      } else {
        setError(data.error || '卡密不存在或已失效')
      }
    } catch (error) {
      setError('获取卡密失败，请重试')
    }
    setLoading(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const copyField = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleConfirmUse = async () => {
    setLoading(true)
    await fetchCardKey(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">正在获取卡密信息...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">访问失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            请检查链接是否正确或联系管理员
          </p>
        </div>
      </div>
    )
  }

  if (!cardKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">未找到卡密信息</p>
        </div>
      </div>
    )
  }

  // 显示确认使用界面
  if (showConfirmation && cardKey && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">确认使用卡密</h1>
            <p className="text-gray-600">请确认您要使用这个卡密</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      重要提示
                    </h3>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p>• 点击"确认使用"后，您才能够查看完整的卡密信息</p>
                      <p>• 即使你未使用，账号的到期时间也不会延长</p>                      
                      <p>• 请确保您确实需要使用此卡密</p>
                      <p>• 确认使用后退款可能受到限制</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">卡密基本信息</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">邮箱：</span>{cardKey.email}</p>
                    <p><span className="font-medium">到期日：</span>{cardKey.expiry_date}</p>
                    <p><span className="font-medium">创建时间：</span>{new Date(cardKey.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleConfirmUse}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
                  >
                    确认使用
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">卡密信息</h1>
          <p className="text-gray-600">请妥善保存以下信息</p>
        </div>

        {/* 状态提示 */}
        {cardKey.is_used && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    此卡密已使用 
                    {cardKey.used_at && ` (${new Date(cardKey.used_at).toLocaleString()})`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 复制成功提示 */}
        {copied && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-semibold">
            ✅ 复制成功！
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 格式化显示 */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">完整信息</h2>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition duration-200"
                >
                  复制全部
                </button>
              </div>
            </div>
            <div className="p-6">
              <pre className="card-key-text bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto border">
                {formatted}
              </pre>
            </div>

            {/* 分字段显示 */}
            <div className="border-t">
              <div className="bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">详细信息</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">租户URL</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={cardKey.tenant_url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 text-sm font-medium"
                      />
                      <button
                        onClick={() => copyField(cardKey.tenant_url)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-md text-sm"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={cardKey.email}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 text-sm font-medium"
                      />
                      <button
                        onClick={() => copyField(cardKey.email)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-md text-sm"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">访问令牌 (Token)</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={cardKey.access_token}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 text-sm font-mono font-medium"
                      />
                      <button
                        onClick={() => copyField(cardKey.access_token)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-md text-sm"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  {cardKey.balance_url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">余额查询URL</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={cardKey.balance_url}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 text-sm font-medium"
                        />
                        <button
                          onClick={() => copyField(cardKey.balance_url!)}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-md text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">实际到期日</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={cardKey.expiry_date}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 text-sm font-medium"
                      />
                      <button
                        onClick={() => copyField(cardKey.expiry_date)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-md text-sm"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  {/* 查询参数字段已隐藏，因为对用户无意义 */}
                </div>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-center items-center space-x-8 text-sm text-gray-800">
                <div>
                  <span className="font-semibold text-gray-900">创建时间：</span>
                  <span className="font-medium">{new Date(cardKey.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">状态：</span>
                  <span className={`ml-1 px-3 py-1 rounded text-sm font-semibold ${cardKey.is_used ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {cardKey.is_used ? '已使用' : '未使用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 页面底部间距 */}
          <div className="mt-8"></div>
        </div>
      </div>
    </div>
  )
}
