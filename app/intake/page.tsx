'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function IntakeListPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch intake submissions from Convex
  const intakeSubmissions = useQuery(api.intake.list, { limit: 100 })

  // Filter submissions based on search query
  const filteredSubmissions = (intakeSubmissions ?? []).filter((submission) => {
    const query = searchQuery.toLowerCase()
    const fullName = `${submission.firstName} ${submission.lastName}`.toLowerCase()
    return (
      fullName.includes(query) ||
      (submission.email?.toLowerCase() || '').includes(query) ||
      (submission.phone || '').includes(query) ||
      (submission.practiceArea?.toLowerCase() || '').includes(query)
    )
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAppointmentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Loading state - Skeleton UI
  if (intakeSubmissions === undefined) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent>
            {/* Search Bar Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-[400px]" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Practice Area</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Form Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Intake Submissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all client intake submissions
            </p>
          </div>
          <Button asChild>
            <Link href="/intake/new">
              <Plus className="h-4 w-4 mr-2" />
              New Intake
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or practice area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Practice Area</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Form Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <p>No submissions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow
                      key={submission._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/intake/${submission._id}`)}
                    >
                      <TableCell className="font-medium">
                        {submission.firstName} {submission.lastName}
                      </TableCell>
                      <TableCell>
                        {submission.email || (
                          <span className="text-muted-foreground italic">No email</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.phone || (
                          <span className="text-muted-foreground italic">No phone</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.practiceArea}</Badge>
                      </TableCell>
                      <TableCell>
                        {submission.appointmentDate && submission.appointmentTime ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-sm">
                              {formatAppointmentDate(submission.appointmentDate)} at{' '}
                              {submission.appointmentTime}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.status === 'complete' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Incomplete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(submission.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/intake/${submission._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
