"use client"

import * as React from "react"
import Link from "next/link"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function SiteBreadcrumb() {
  const items = useBreadcrumbs()
  const isMobile = useIsMobile()

  // Don't show breadcrumb on Dashboard
  if (items.length <= 1) return null

  const renderItems = () => {
    // Show all items if there are 3 or fewer, or if not on mobile
    if (items.length <= 3 || !isMobile) {
      return items.map((item, index) => (
        <React.Fragment key={item.href}>
          <BreadcrumbItem>
            {item.active ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={item.href}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {index < items.length - 1 && <BreadcrumbSeparator />}
        </React.Fragment>
      ))
    }

    // On mobile with 4+ items: Dashboard > ... > Last
    const firstItem = items[0]
    const lastItem = items[items.length - 1]

    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={firstItem.href}>{firstItem.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{lastItem.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </>
    )
  }

  return (
    <Breadcrumb className="ml-2">
      <BreadcrumbList>{renderItems()}</BreadcrumbList>
    </Breadcrumb>
  )
}
