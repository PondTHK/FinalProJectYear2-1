"use client";

import React from "react";

export default function JewelryDashboard() {
  return (
    <div className="min-h-screen bg-[#F5F1EB] p-6">
      <div className="flex gap-6 h-[calc(100vh-3rem)]">
        {/* Left Section - 70% */}
        <div className="flex-[0.7] flex flex-col gap-6">
          {/* Top Row - User Avatars */}
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-[20px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 border-2 border-white shadow-lg"></div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                  3
                </span>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 border-2 border-white shadow-lg"></div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                  5
                </span>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 border-2 border-white shadow-lg"></div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                  2
                </span>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 border-2 border-white shadow-lg"></div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-200 to-green-300 border-2 border-white shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Middle Grid - 2x2 Cards */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Top Left - Pastel Peach */}
            <div className="bg-gradient-to-br from-[#FFE5D9] to-[#FFD4C4] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(255,180,162,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <svg className="w-6 h-6 text-[#D97757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <button className="text-[#D97757]/60 hover:text-[#D97757] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-[#8B5A3C] text-sm font-medium mb-2">Total Sales</p>
                <h3 className="text-[#5C3A28] text-3xl font-bold mb-2">$1,284</h3>
              </div>
            </div>

            {/* Top Right - Pastel Blue */}
            <div className="bg-gradient-to-br from-[#D4E4F7] to-[#B8D4F0] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(180,212,240,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <svg className="w-6 h-6 text-[#4A7BA7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <button className="text-[#4A7BA7]/60 hover:text-[#4A7BA7] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-[#3A5A7A] text-sm font-medium mb-2">Total Making</p>
                <h3 className="text-[#2A4A6A] text-3xl font-bold mb-2">$42,215</h3>
              </div>
            </div>

            {/* Bottom Left - Pastel Orange/Salmon */}
            <div className="bg-gradient-to-br from-[#FFD9CC] to-[#FFC4B0] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(255,196,176,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <svg className="w-6 h-6 text-[#D97757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <button className="text-[#D97757]/60 hover:text-[#D97757] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-[#8B5A3C] text-sm font-medium mb-2">Order not Initiated</p>
                <h3 className="text-[#5C3A28] text-3xl font-bold mb-2">$3,842</h3>
              </div>
            </div>

            {/* Bottom Right - Pastel Purple */}
            <div className="bg-gradient-to-br from-[#E8D5F2] to-[#D9C4E8] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(217,196,232,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <svg className="w-6 h-6 text-[#8B6FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <button className="text-[#8B6FA8]/60 hover:text-[#8B6FA8] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-[#6B4F88] text-sm font-medium mb-2">Delayed job Orders</p>
                <h3 className="text-[#4A2F68] text-3xl font-bold mb-2">$845.84</h3>
              </div>
            </div>
          </div>

          {/* Bottom Section - Progress Bars */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50">
            <h3 className="text-gray-800 text-lg font-semibold mb-6">Jewellery Sales Variance</h3>
            
            {/* Gold Jewellery */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium">Gold Jewellery</span>
                </div>
                <span className="text-red-500 text-sm font-medium">Error -4.2%</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: '48%' }}></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                <span>Forecasted: $120,000</span>
                <span>Actual: $115,000</span>
                <span>Variance: -$5,000</span>
              </div>
            </div>

            {/* Diamond Jewellery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium">Diamond Jewellery</span>
                </div>
                <span className="text-green-500 text-sm font-medium">Error +3.8%</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: '52%' }}></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                <span>Forecasted: $180,000</span>
                <span>Actual: $187,000</span>
                <span>Variance: +$7,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - 30% */}
        <div className="flex-[0.3] bg-white/60 backdrop-blur-sm rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50 flex flex-col items-center">
          {/* Profile Picture */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.5)] border-4 border-white flex items-center justify-center overflow-hidden">
            <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Name */}
          <h2 className="text-gray-800 text-xl font-bold mb-6">Mason Walker</h2>

          {/* Editable Fields */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="text-gray-600 text-sm">First Name</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">Mason</span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="text-gray-600 text-sm">Last Name</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">Walker</span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="text-gray-600 text-sm">Email</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium text-xs">masonwalker@gmail.com</span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="text-gray-600 text-sm">Phone</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">+9446357359</span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contact Icons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

