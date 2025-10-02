import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Textarea } from '@/components/ui/textarea'
import { useSelectedAravt } from '@/hooks/useSelectedAravt'
import { useAuthStore } from '@/store/auth'
import { useOffersStore } from '@/store/offers'
import { useProjectsStore } from '@/store/projects'
import { CreateOffer, Offer, Project } from '@/types'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const OffersManagement = () => {
  const { user } = useAuthStore();
  const { currentAravtId } = useSelectedAravt();
  const { offers, isLoading, error, fetchOffers } = useOffersStore()
  const { projects, isLoading: projectsLoading, fetchProjectsForAravt } = useProjectsStore()
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  useEffect(() => {
    if (user && currentAravtId) {
      fetchProjectsForAravt(currentAravtId)
    }
  }, [user, currentAravtId, fetchProjectsForAravt])

  if (isLoading || projectsLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  // Filter if projectId is provided
  const filteredOffers = projectId 
    ? offers.filter(o => (o.business?.id === Number(projectId)))
    : offers;

  // Group offers by project with type safety
  const offersByProject = filteredOffers.reduce<{[K: number]: Offer[]}>((acc, offer) => {
    const projectId = offer.business?.id
    if (!acc[projectId]) {
      acc[projectId] = []
    }
    acc[projectId].push(offer)
    return acc
  }, {})

  const filteredProjectsMap = filteredOffers.reduce<{[K: number]: Project}>((acc, offer) => {
    const projectId = offer.business?.id
    if (!acc[projectId]) {
      acc[projectId] = offer.business
    }
    return acc
  }, {})
  
  const filteredProjects = Object.values(filteredProjectsMap)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-left">Offers from Aravts</h1>
          <p className="text-gray-500 text-left">Trading with others</p>
        </div>
        <CreateOfferDialog projects={projects} />
      </div>

      {filteredProjects.map((project) => (
        <div key={project.id} className="space-y-4">
          <div className="flex items-center gap-2">
            {project.logo && (
              <img src={project.logo} alt={project.name} className="h-6 w-6" />
            )}
            <h2 className="text-xl font-semibold">{project.name}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offersByProject[project.id]?.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
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
        <div className="">
          <p>Offer Validity period {offer.duration} days</p>
          <p className="font-medium">Price: ${offer.price}</p>
          {offer.is_limited && (
            <p className="text-amber-600">
              {offer.count_left} remaining
            </p>
          )}
        </div>
        <Button className="mt-2" disabled variant="outline" size="sm">Buy Now</Button>

      </CardContent>
    </Card>
  )
}

function CreateOfferDialog({ projects }: { projects: Project[] }) {
  const [isLimited, setIsLimited] = useState(false)
  const { createOffer } = useOffersStore()
  const { currentAravtId } = useSelectedAravt()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newOffer: CreateOffer = {
      name: formData.get('name') as string,
      business_id: Number(formData.get('business_id')),
      description: formData.get('description') as string,
      is_limited: isLimited,
      count_left: isLimited ? Number(formData.get('count_left')) : 0,
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price')),
      assets: {}
    }

    if (!currentAravtId) {
      return
    }
    await createOffer(currentAravtId, newOffer)
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
            Add your Offers for other Aravts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="business_id">Project</Label>
            <select 
              id="business_id" 
              name="business_id"
              className="bg-white w-full border rounded-md p-2"
              required
            >
              <option value="">Select a project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="name">Title</Label>
            <Input id="name" name="name" required placeholder='Selling Online'/>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required  placeholder='Your offer description, benefits, terms and conditions, other details' />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="price">Price (USD)</Label>
              <Input id="price" placeholder="15000" name="price" type="number" required />
            </div>
            <div className="flex-1">
              <Label htmlFor="duration">Offer Validity (days)</Label>
              <Input id="duration" name="duration" placeholder="30" type="number" required />
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
            <Label htmlFor="is_limited">Limited number</Label>
          </div>
          {isLimited && (
            <div>
              <Label htmlFor="count_left">Available</Label>
              <Input id="count_left" name="count_left" type="number" placeholder="100" required />
            </div>
          )}
          <Button type="submit" className="w-full">Create Offer</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default OffersManagement
