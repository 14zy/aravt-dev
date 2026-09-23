import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { useAuthStore } from '@/store/auth';
import { useOffersStore } from '@/store/offers';
import { useProjectsStore } from '@/store/projects';
import { CreateOffer, Offer, Project } from '@/types';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  Layers3,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const OffersManagement = () => {
  const { user } = useAuthStore();
  const { currentAravtId } = useSelectedAravt();
  const { offers, isLoading, error, fetchOffers } = useOffersStore();
  const { projects, isLoading: projectsLoading, fetchProjectsForAravt } = useProjectsStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const selectedProjectId = searchParams.get('projectId') ?? 'all';

  useEffect(() => {
    void fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    if (user && currentAravtId) {
      void fetchProjectsForAravt(currentAravtId);
    }
  }, [user, currentAravtId, fetchProjectsForAravt]);

  const marketplaceProjects = useMemo(() => {
    const projectMap = new Map<number, Project>();
    offers.forEach((offer) => projectMap.set(offer.business.id, offer.business));
    return Array.from(projectMap.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesProject = selectedProjectId === 'all' || offer.business.id === Number(selectedProjectId);
      const matchesSearch = !query || [
        offer.name,
        offer.description,
        offer.business.name,
        offer.aravt.name,
      ].some(value => value.toLowerCase().includes(query));

      return matchesProject && matchesSearch;
    });
  }, [offers, searchQuery, selectedProjectId]);

  const offerGroups = useMemo(() => {
    const groups = new Map<number, { project: Project; offers: Offer[] }>();

    filteredOffers.forEach((offer) => {
      const currentGroup = groups.get(offer.business.id);
      if (currentGroup) {
        currentGroup.offers.push(offer);
      } else {
        groups.set(offer.business.id, { project: offer.business, offers: [offer] });
      }
    });

    return Array.from(groups.values()).sort((first, second) => first.project.name.localeCompare(second.project.name));
  }, [filteredOffers]);

  const stats = useMemo(() => ({
    projects: marketplaceProjects.length,
    aravts: new Set(offers.map(offer => offer.aravt.id)).size,
    limited: filteredOffers.filter(offer => offer.is_limited).length,
  }), [filteredOffers, marketplaceProjects.length, offers]);

  const updateProjectFilter = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      nextParams.delete('projectId');
    } else {
      nextParams.set('projectId', value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const clearFilters = () => {
    setSearchQuery('');
    updateProjectFilter('all');
  };

  if ((isLoading && offers.length === 0) || projectsLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl  overflow-hidden ">
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-96 -z-10 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-violet-100/80 via-transparent to-transparent" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
              Aravt marketplace
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Discover aravts offers</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Explore services and opportunities created by Aravt teams, or publish an offer from one of your projects.
            </p>
          </div>
          <CreateOfferDialog projects={projects} />
        </div>

        <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 sm:max-w-xl sm:gap-4">
          {[
            { label: 'Offers', value: offers.length, icon: ShoppingBag, color: 'text-violet-600' },
            { label: 'Projects', value: stats.projects, icon: BriefcaseBusiness, color: 'text-emerald-600' },
            { label: 'Aravts', value: stats.aravts, icon: Users, color: 'text-amber-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4">
              <Icon className={`mb-2 h-4 w-4 ${color}`} />
              <p className="truncate text-lg font-bold text-slate-950">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchOffers()} className="rounded-xl">
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="offers-heading" className="space-y-5">
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="offers-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Available offers</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} available
              {stats.limited > 0 && ` · ${stats.limited} limited`}.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search offers or projects"
                  aria-label="Search offers"
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-10 focus-visible:bg-white focus-visible:ring-violet-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-transparent p-0 text-slate-400 hover:border-transparent hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={selectedProjectId} onValueChange={updateProjectFilter}>
                <SelectTrigger aria-label="Filter by project" className="h-11 rounded-xl border-slate-200 bg-white md:w-[220px]">
                  <Layers3 className="mr-2 h-4 w-4 text-violet-600" />
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {marketplaceProjects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {offerGroups.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="relative flex min-h-[330px] flex-col items-center justify-center p-8 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.10),_transparent_55%)]" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <PackageOpen className="h-6 w-6" />
              </div>
              <h3 className="relative mt-5 text-lg font-bold text-slate-950">
                {offers.length === 0 ? 'No offers yet' : 'No matching offers'}
              </h3>
              <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {offers.length === 0
                  ? 'Be the first to publish an offer from one of your Aravt projects.'
                  : 'Try a different search term or clear the selected project filter.'}
              </p>
              {(searchQuery || selectedProjectId !== 'all') && (
                <Button type="button" variant="outline" onClick={clearFilters} className="relative mt-5 rounded-xl">
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {offerGroups.map(({ project, offers: projectOffers }) => {
              const aravt = projectOffers[0].aravt;
              return (
                <section key={project.id} aria-labelledby={`project-${project.id}`} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProjectLogo project={project} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 id={`project-${project.id}`} className="truncate text-lg font-bold text-slate-950 sm:text-xl">{project.name}</h3>
                          <Badge variant="secondary" className="rounded-full">{projectOffers.length}</Badge>
                        </div>
                        <Link
                          to={`/aravts/${aravt.id}`}
                          className="mt-0.5 inline-flex items-center !text-xs !font-medium !text-slate-500 transition hover:!text-violet-700"
                        >
                          Aravt №{aravt.id}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projectOffers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const ProjectLogo = ({ project }: { project: Project }) => (
  project.logo ? (
    <img
      src={project.logo}
      alt={`${project.name} logo`}
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
    />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
      <BriefcaseBusiness className="h-5 w-5" />
    </span>
  )
);

const OfferCard = ({ offer }: { offer: Offer }) => {
  const soldOut = offer.is_limited && (offer.count_left ?? 0) <= 0;
  const durationLabel = offer.duration
    ? `${offer.duration} ${offer.duration === 1 ? 'day' : 'days'}`
    : 'Flexible';

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-slate-200 shadow-none transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-slate-900/5">
      <CardHeader className="space-y-4 p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
            <Store className="h-5 w-5" />
          </span>
          {offer.is_limited ? (
            <Badge className={`rounded-full ${soldOut ? 'bg-slate-100 text-slate-600 hover:bg-slate-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-50'}`}>
              {soldOut ? 'Sold out' : `${offer.count_left ?? 0} remaining`}
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full">Available</Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-lg leading-6 text-slate-950">{offer.name}</CardTitle>
          <CardDescription className="mt-2 line-clamp-3 min-h-[3.75rem] leading-5 text-slate-500">
            {offer.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-5 pb-4 pt-2">
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
            {durationLabel}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-2">
            <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" />
            USD
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 border-t border-slate-100 p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Price</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">{priceFormatter.format(offer.price)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="rounded-xl px-4">
            Buy
            <ShoppingBag className="h-4 w-4" />
          </Button>
          <Button asChild className="rounded-xl bg-slate-950 px-4 text-white hover:bg-violet-700">
            <Link to={`/projects/${offer.business.id}`} className="!text-white hover:!text-white">
              View project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
        </div>
      </CardFooter>
    </Card>
  );
};

const CreateOfferDialog = ({ projects }: { projects: Project[] }) => {
  const [open, setOpen] = useState(false);
  const [isLimited, setIsLimited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOffer } = useOffersStore();
  const { currentAravtId } = useSelectedAravt();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentAravtId) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newOffer: CreateOffer = {
      name: (formData.get('name') as string).trim(),
      business_id: Number(formData.get('business_id')),
      description: (formData.get('description') as string).trim(),
      is_limited: isLimited,
      count_left: isLimited ? Number(formData.get('count_left')) : 0,
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price')),
      assets: {},
    };

    setIsSubmitting(true);
    await createOffer(currentAravtId, newOffer);
    setIsSubmitting(false);

    if (!useOffersStore.getState().error) {
      form.reset();
      setIsLimited(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!currentAravtId || projects.length === 0} className="self-start rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          Create offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl text-slate-950">Create a new offer</DialogTitle>
          <DialogDescription>Publish a product or service from one of your Aravt projects.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="business_id" className="font-semibold text-slate-700">Project</Label>
            <Select name="business_id" required disabled={isSubmitting}>
              <SelectTrigger id="business_id" className="h-11 rounded-xl">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold text-slate-700">Offer title</Label>
            <Input id="name" name="name" required disabled={isSubmitting} placeholder="e.g. Online store setup" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold text-slate-700">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              disabled={isSubmitting}
              placeholder="Describe the benefits, deliverables, and important terms."
              className="min-h-28 resize-none rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price" className="font-semibold text-slate-700">Price (USD)</Label>
              <Input id="price" name="price" type="number" inputMode="decimal" min="0" step="0.01" required disabled={isSubmitting} placeholder="150.00" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="font-semibold text-slate-700">Validity (days)</Label>
              <Input id="duration" name="duration" type="number" inputMode="numeric" min="1" step="1" required disabled={isSubmitting} placeholder="30" className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="is_limited" className="font-semibold text-slate-800">Limit availability</Label>
                <p className="mt-1 text-xs text-slate-500">Set a fixed number of offers that can be purchased.</p>
              </div>
              <Switch id="is_limited" checked={isLimited} onCheckedChange={setIsLimited} disabled={isSubmitting} />
            </div>
            {isLimited && (
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                <Label htmlFor="count_left" className="font-semibold text-slate-700">Available quantity</Label>
                <Input id="count_left" name="count_left" type="number" inputMode="numeric" min="1" step="1" placeholder="100" required disabled={isSubmitting} className="h-11 rounded-xl bg-white" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-950 text-white hover:bg-violet-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? 'Publishing...' : 'Publish offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OffersManagement;
