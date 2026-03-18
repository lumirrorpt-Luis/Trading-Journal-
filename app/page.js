'use client'
import dynamic from 'next/dynamic'

const Journal = dynamic(() => import('../components/Journal'), { ssr: false })

export default function Home() {
  return <Journal />
}
