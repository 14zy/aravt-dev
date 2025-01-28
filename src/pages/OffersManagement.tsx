import { useEffect, useState } from 'react'
import { useOffersStore } from '@/store/offers'
import { useProjectsStore } from '@/store/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Offer, Project, CreateOffer } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth';

const OffersManagement = () => {
  const { user, aravt } = useAuthStore();
  const { offers, isLoading, error, fetchOffers } = useOffersStore()
  const { projects, isLoading: projectsLoading, fetchProjectsForAravt } = useProjectsStore()
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  useEffect(() => {
    if (user && aravt) {
      fetchProjectsForAravt(aravt.id)
    }
  }, [user, fetchProjectsForAravt])

  if (isLoading || projectsLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  // Filter if projectId is provided
  const filteredOffers = projectId 
    ? offers.filter(o => (o.project?.id === Number(projectId)))
    : offers;

  // Group offers by project with type safety
  const offersByProject = filteredOffers.reduce<{[K: number]: Offer[]}>((acc, offer) => {
    const projectId = offer.project?.id
    if (!acc[projectId]) {
      acc[projectId] = []
    }
    acc[projectId].push(offer)
    return acc
  }, {})

  const filteredProjectsMap = filteredOffers.reduce<{[K: number]: Project}>((acc, offer) => {
    const projectId = offer.project?.id
    if (!acc[projectId]) {
      acc[projectId] = offer.project
    }
    return acc
  }, {})
  
  const filteredProjects = Object.values(filteredProjectsMap)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Offers Management</h1>
          <p className="text-gray-500">Manage offers for your projects</p>
        </div>
        <CreateOfferDialog projects={projects} />
      </div>

      {filteredProjects.map((project) => (
        <div key={`project-${project.id}`} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            {project.logo && (
              <img src={project.logo} alt={project.name} className="h-6 w-6" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offersByProject[project.id]?.map((offer) => (
              <OfferCard key={`offer-${offer.id}`} offer={offer} />
            )) || (
              <p className="text-gray-500 col-span-full">No offers for this project yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{offer.name}</CardTitle>
        <CardDescription>{offer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-medium">Price: ${offer.price}</p>
          {offer.is_limited && (
            <p className="text-amber-600">
              {offer.count_left} remaining
            </p>
          )}
          <p>Duration: {offer.duration} days</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateOfferDialog({ projects }: { projects: Project[] }) {
  const [isLimited, setIsLimited] = useState(false)
  const { createOffer } = useOffersStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newOffer: CreateOffer = {
      name: formData.get('name') as string,
      project_id: Number(formData.get('project_id')),
      description: formData.get('description') as string,
      is_limited: isLimited,
      count_left: isLimited ? Number(formData.get('count_left')) : 0,
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price')),
      assets: {}
    }

    await createOffer(newOffer)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Create a new offer for your project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project_id">Project</Label>
            <select 
              id="project_id" 
              name="project_id"
              className="bg-white w-full border rounded-md p-2"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="name">Offer Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" required />
            </div>
            <div className="flex-1">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input id="duration" name="duration" type="number" required />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_limited"
              className="h-4 w-4"
              checked={isLimited}
              onChange={(e) => setIsLimited(e.target.checked)}
            />
            <Label htmlFor="is_limited">Limited availability</Label>
          </div>
          {isLimited && (
            <div>
              <Label htmlFor="count_left">Available Offers</Label>
              <Input id="count_left" name="count_left" type="number" required />
            </div>
          )}
          <Button type="submit" className="w-full">Create Offer</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default OffersManagement
