'use client';
import { AppKitButton } from '@reown/appkit/react'

export default function Header() {
    return <div className="flex items-center justify-between p-5">
        <div>Logo</div>
        <AppKitButton />
    </div>
}