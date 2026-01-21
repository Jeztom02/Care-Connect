import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Stethoscope, Loader2, Star, Users, Mail, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { useDoctorRecommendation, DoctorRecommendation as DoctorRec } from '@/hooks/useKNN';
import { useToast } from '@/hooks/use-toast';

interface DoctorRecommendationProps {
  patientId: string;
  patientName?: string;
  patientCondition?: string;
}

export const DoctorRecommendation = ({ patientId, patientName, patientCondition }: DoctorRecommendationProps) => {
  const { recommendDoctors, loading, error, result } = useDoctorRecommendation();
  const { toast } = useToast();
  const [specialty, setSpecialty] = useState('');
  const [k, setK] = useState(3);

  const handleRecommend = async () => {
    try {
      await recommendDoctors(patientId, k, specialty || undefined);
      toast({
        title: '✅ Doctors Recommended',
        description: `Found ${k} best doctor matches for this patient`,
      });
    } catch (err) {
      toast({
        title: '❌ Recommendation Failed',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 75) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Possible Match';
  };

  const getAvailabilityColor = (availability: string) => {
    if (availability === 'High') return 'bg-green-100 text-green-700';
    if (availability === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-600" />
          Doctor Recommendations (KNN)
        </CardTitle>
        <CardDescription>
          Find the best doctors based on specialty, experience, and availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <div className="space-y-3">
            {/* Patient Info */}
            {patientName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm">
                  <strong>Patient:</strong> {patientName}
                </p>
                {patientCondition && (
                  <p className="text-sm">
                    <strong>Condition:</strong> {patientCondition}
                  </p>
                )}
              </div>
            )}

            {/* Specialty Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Required Specialty (optional):
              </label>
              <Input
                placeholder="e.g., Cardiology, Neurology, General Medicine"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to search all specialties
              </p>
            </div>

            {/* Number of Recommendations */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Number of recommendations:
              </label>
              <div className="flex gap-2">
                {[3, 5, 10].map(num => (
                  <Button
                    key={num}
                    variant={k === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setK(num)}
                    disabled={loading}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleRecommend} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Best Doctors...
                </>
              ) : (
                <>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Recommend Doctors
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Patient & Search Info */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="font-semibold text-teal-900 mb-2">Search Criteria</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Patient:</strong> {result.patient.name}</p>
                <p><strong>Condition:</strong> {result.patient.condition}</p>
                {result.patient.department && (
                  <p><strong>Department:</strong> {result.patient.department}</p>
                )}
                {result.requestedSpecialty && (
                  <p><strong>Requested Specialty:</strong> {result.requestedSpecialty}</p>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Top {result.recommendations.length} Recommendations
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRecommend}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {/* Doctors List */}
            <div className="space-y-3">
              {result.recommendations.map((doctor: DoctorRec) => (
                <Card key={doctor.rank} className="border-l-4" style={{
                  borderLeftColor: doctor.matchScore >= 90 ? '#22c55e' : 
                                   doctor.matchScore >= 75 ? '#3b82f6' : 
                                   doctor.matchScore >= 60 ? '#eab308' : '#6b7280'
                }}>
                  <CardContent className="p-4">
                    {/* Doctor Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold">
                          #{doctor.rank}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{doctor.doctor.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {doctor.doctor.email}
                          </p>
                          <div className="mt-1">
                            {renderStars(doctor.doctor.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getMatchColor(doctor.matchScore)}>
                          {doctor.matchScore}% Match
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getMatchLabel(doctor.matchScore)}
                        </p>
                      </div>
                    </div>

                    {/* Specialty & Department */}
                    <div className="flex gap-2 mb-3">
                      <Badge variant="default" className="text-xs">
                        <Stethoscope className="h-3 w-3 mr-1" />
                        {doctor.doctor.specialty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {doctor.doctor.department}
                      </Badge>
                      <Badge className={`text-xs ${getAvailabilityColor(doctor.availability)}`}>
                        {doctor.availability} Availability
                      </Badge>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {doctor.doctor.experienceYears} years
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {doctor.doctor.rating}/5.0
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground">Caseload</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {doctor.doctor.currentPatients} patients
                        </p>
                      </div>
                    </div>

                    {/* Recommendation Reasons */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-blue-900 mb-2">
                        Why Recommended:
                      </h5>
                      <ul className="space-y-1">
                        {doctor.recommendationReasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Assign Button */}
                    <Button 
                      className="w-full mt-3" 
                      size="sm"
                      variant={doctor.matchScore >= 75 ? 'default' : 'outline'}
                    >
                      Assign Doctor to Patient
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-right">
              Generated: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
