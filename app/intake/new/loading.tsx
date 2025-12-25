import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewIntakeLoading() {
  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back button skeleton */}
      <div className="mb-4">
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="flex gap-8">
        {/* Left - Form Panel Skeleton */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Title */}
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />

            {/* Create PDF Section */}
            <div className="mb-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex gap-6">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>

            {/* Practice Area */}
            <div className="mb-5">
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Call Details */}
            <div className="mb-5">
              <Skeleton className="h-4 w-24 mb-1.5" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Section Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <Skeleton className="h-3 w-32" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-28 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            {/* Section Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <Skeleton className="h-3 w-20" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Street Address */}
            <div className="mb-5">
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Street Address 2 */}
            <div className="mb-5">
              <Skeleton className="h-4 w-40 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Right - Calendar Panel Skeleton */}
        <Card className="w-[400px] flex-shrink-0">
          <CardContent className="p-6">
            {/* Calendar Header */}
            <div className="mb-6">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>

            {/* Staff Selection */}
            <div className="mb-6">
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>

            {/* Meeting Type */}
            <div className="mb-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
