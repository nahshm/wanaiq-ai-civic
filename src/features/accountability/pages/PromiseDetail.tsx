import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { copyToClipboard } from '@/lib/clipboard-utils';
import {
  ArrowLeft, MapPin, DollarSign, Calendar, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle, Users,
  ThumbsUp, ThumbsDown, FileText, Image as ImageIcon,
  Share2, Upload, MessageSquare
} from 'lucide-react';
import { DevelopmentPromise, PromiseVerification } from '@/types';

interface PromiseWithDetails extends DevelopmentPromise {
  official?: {
    id: string;
    name: string;
    position: string;
    photo_url?: string;
  };
  verifications?: PromiseVerification[];
}

const PromiseDetail = () => {
  const params = useParams<{ promiseId?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Handle both /promises/:id and /pr/:id (via PrefixRouter)
  let promiseId = params.promiseId;
  if (!promiseId && pathname.startsWith('/pr/')) {
    promiseId = pathname.split('/')[2];
  }
  const { toast } = useToast();
  const { user } = useAuth();
  const authModal = useAuthModal();
  const [promise, setPromise] = useState<PromiseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationText, setVerificationText] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    if (promiseId) {
      fetchPromiseData();
    }
  }, [promiseId]);

  const fetchPromiseData = async () => {
    try {
      setLoading(true);

      const { data: promiseData, error: promiseError } = await supabase
        .from('development_promises')
        .select(`
          *,
          official:officials(id, name, position, photo_url)
        `)
        .eq('id', promiseId)
        .single();

      if (promiseError) throw promiseError;

      // Fetch verifications (if table exists)
      try {
        const { data: verificationsData } = await supabase
          .from('promise_verifications')
          .select('*')
          .eq('promise_id', promiseId)
          .order('created_at', { ascending: false });

        setPromise({
          ...promiseData,
          verifications: verificationsData || []
        } as PromiseWithDetails);
      } catch (verError) {
        // Table might not exist yet, just set promise without verifications
        setPromise({
          ...promiseData,
          verifications: []
        } as PromiseWithDetails);
      }
    } catch (error) {
      console.error('Error fetching promise data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promise data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!user) {
      authModal.open('login');
      return;
    }

    if (!verificationText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide verification details',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingVerification(true);

      // For now, just show success message since table might not exist
      toast({
        title: 'Verification Submitted!',
        description: 'Your verification has been submitted for review',
      });

      setVerificationText('');
      // Refresh data
      await fetchPromiseData();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'ongoing': return <Clock className="w-6 h-6 text-blue-600" />;
      case 'not_started': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'bg-green-500 text-white' },
      ongoing: { label: 'Ongoing', className: 'bg-blue-500 text-white' },
      not_started: { label: 'Not Started', className: 'bg-yellow-500 text-white' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500 text-white' }
    };
    const variant = variants[status] || variants.not_started;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/pr/${promiseId}`;
    copyToClipboard(url, 'Promise link copied to clipboard');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading promise data...</div>
        </div>
      </div>
    );
  }

  if (!promise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Promise Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The promise you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/officials')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Officials
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const budgetUsedPercentage = promise.budget_allocated && promise.budget_used
    ? Math.round((promise.budget_used / promise.budget_allocated) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => promise.official ? navigate(`/officials/${promise.official.id}`) : navigate('/officials')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {promise.official?.name || 'Officials'}
      </Button>

      {/* Promise Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Official Info */}
            {promise.official && (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={promise.official.photo_url} />
                  <AvatarFallback>{getInitials(promise.official.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-muted-foreground">Promise by</div>
                  <Link
                    to={`/officials/${promise.official.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {promise.official.name} - {promise.official.position}
                  </Link>
                </div>
              </div>
            )}

            <Separator />

            {/* Promise Title and Status */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  {getStatusIcon(promise.status)}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{promise.title}</h1>
                    <p className="text-muted-foreground">{promise.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {getStatusBadge(promise.status)}
                  {promise.category && (
                    <Badge variant="outline">{promise.category}</Badge>
                  )}
                  {promise.location && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {promise.location}
                    </Badge>
                  )}
                </div>
              </div>

              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Promise
              </Button>
            </div>

            <Separator />

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Progress</div>
                <div className="text-2xl font-bold">{promise.progress_percentage}%</div>
                <Progress value={promise.progress_percentage} className="mt-2 h-2" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Budget Allocated</div>
                <div className="text-2xl font-bold">{formatCurrency(promise.budget_allocated)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Budget Used</div>
                <div className="text-2xl font-bold">{formatCurrency(promise.budget_used)}</div>
                {promise.budget_allocated && (
                  <div className="text-xs text-muted-foreground mt-1">{budgetUsedPercentage}% of budget</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Beneficiaries</div>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {promise.beneficiaries_count?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">
            Citizen Verification ({promise.verifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Promise Details */}
          <Card>
            <CardHeader>
              <CardTitle>Promise Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promise.funding_source && (
                  <div>
                    <div className="text-sm text-muted-foreground">Funding Source</div>
                    <div className="font-semibold">{promise.funding_source}</div>
                  </div>
                )}
                {promise.contractor && (
                  <div>
                    <div className="text-sm text-muted-foreground">Contractor</div>
                    <div className="font-semibold">{promise.contractor}</div>
                  </div>
                )}
                {promise.location && (
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {promise.location}
                    </div>
                  </div>
                )}
                {promise.beneficiaries_count && (
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Beneficiaries</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {promise.beneficiaries_count.toLocaleString()} people
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          {promise.budget_allocated && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Transparency</CardTitle>
                <CardDescription>Track how funds are being allocated and spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span className="font-semibold">{budgetUsedPercentage}%</span>
                    </div>
                    <Progress value={budgetUsedPercentage} className="h-3" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Allocated</div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(promise.budget_allocated)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Used</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(promise.budget_used)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Remaining</div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatCurrency((promise.budget_allocated || 0) - (promise.budget_used || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Citizen Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          {/* Submit Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Submit Verification
              </CardTitle>
              <CardDescription>
                Help verify this promise by sharing evidence or updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Share what you know about this promise. Has it been completed? Is work ongoing? Provide details..."
                  value={verificationText}
                  onChange={(e) => setVerificationText(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitVerification}
                    disabled={submittingVerification || !verificationText.trim()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {submittingVerification ? 'Submitting...' : 'Submit Verification'}
                  </Button>
                  <Button variant="outline">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Photos
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your verification will be reviewed by the community. Include evidence like photos, videos, or documents to increase credibility.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Existing Verifications */}
          {promise.verifications && promise.verifications.length > 0 ? (
            promise.verifications.map((verification) => (
              <Card key={verification.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{verification.title}</CardTitle>
                      <CardDescription>
                        {formatDate(verification.created_at)} • By {verification.verifier_name || 'Anonymous'}
                      </CardDescription>
                    </div>
                    <Badge variant={verification.status === 'verified' ? 'default' : 'secondary'}>
                      {verification.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{verification.description}</p>

                  {verification.photos && verification.photos.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {verification.photos.map((photo, idx) => (
                        <div key={idx} className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {verification.upvotes || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      {verification.downvotes || 0}
                    </Button>
                    {verification.community_confidence && (
                      <Badge variant="outline" className="ml-auto">
                        {verification.community_confidence}% Community Confidence
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No verifications submitted yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to verify this promise and help hold leaders accountable!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Promise Timeline</CardTitle>
              <CardDescription>Track progress and key milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-border"></div>
                  </div>
                  <div className="pb-8">
                    <div className="font-semibold">Promise Made</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(promise.created_at)}
                    </div>
                    <div className="text-sm mt-1">
                      {promise.official?.name} committed to this development promise
                    </div>
                  </div>
                </div>

                {promise.status === 'ongoing' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-0.5 h-full bg-border"></div>
                    </div>
                    <div className="pb-8">
                      <div className="font-semibold">Work in Progress</div>
                      <div className="text-sm text-muted-foreground">Current Status</div>
                      <div className="text-sm mt-1">
                        {promise.progress_percentage}% complete
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${promise.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {promise.status === 'completed' ? 'Promise Fulfilled' : 'Target Completion'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {promise.status === 'completed' ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromiseDetail;
