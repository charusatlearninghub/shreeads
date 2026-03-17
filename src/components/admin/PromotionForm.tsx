import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Percent, Calendar, BookOpen, Package } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  price: number | null;
  is_free: boolean | null;
}

interface SoftwareProduct {
  id: string;
  title: string;
  price: number | null;
  is_free: boolean | null;
}

interface PromotionFormData {
  name: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  course_ids: string[];
  product_ids: string[];
}

interface PromotionFormProps {
  formData: PromotionFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromotionFormData>>;
  paidCourses: Course[];
  paidSoftware: SoftwareProduct[];
  onSubmit: () => void;
  isEdit?: boolean;
}

export function PromotionForm({ 
  formData, 
  setFormData, 
  paidCourses, 
  paidSoftware,
  onSubmit, 
  isEdit = false 
}: PromotionFormProps) {
  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId],
    }));
  };

  const toggleSoftware = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  const selectAllCourses = () => {
    setFormData(prev => ({
      ...prev,
      course_ids: paidCourses.map(c => c.id),
    }));
  };

  const deselectAllCourses = () => {
    setFormData(prev => ({
      ...prev,
      course_ids: [],
    }));
  };

  const selectAllSoftware = () => {
    setFormData(prev => ({
      ...prev,
      product_ids: paidSoftware.map(s => s.id),
    }));
  };

  const deselectAllSoftware = () => {
    setFormData(prev => ({
      ...prev,
      product_ids: [],
    }));
  };

  const hasItemsSelected = formData.course_ids.length > 0 || formData.product_ids.length > 0;

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Tag className="w-4 h-4" />
          Promotion Details
        </div>
        
        <div className="space-y-3 pl-6">
          <div className="space-y-2">
            <Label htmlFor="promo-name" className="text-sm font-medium">
              Promotion Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="promo-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Summer Sale 2026"
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="promo-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="promo-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this promotion offers..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>
      
      {/* Discount Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Percent className="w-4 h-4" />
          Discount Settings
        </div>
        
        <div className="pl-6 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="promo-discount" className="text-sm font-medium">
              Discount Percentage <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="promo-discount"
                type="number"
                min={1}
                max={100}
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_percentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 10)) 
                }))}
                className="w-24 h-10 text-center font-semibold"
              />
              <span className="text-lg font-semibold text-muted-foreground">%</span>
              <Badge 
                variant={formData.discount_percentage >= 50 ? "destructive" : formData.discount_percentage >= 25 ? "default" : "secondary"}
                className="ml-2"
              >
                {formData.discount_percentage >= 50 ? "Big Sale!" : formData.discount_percentage >= 25 ? "Great Deal" : "Discount"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a value between 1% and 100%
            </p>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch
              id="promo-is-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <div>
              <Label htmlFor="promo-is-active" className="text-sm font-medium cursor-pointer">
                Activate Promotion
              </Label>
              <p className="text-xs text-muted-foreground">
                When active, this promotion will apply during the scheduled period
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Schedule Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Calendar className="w-4 h-4" />
          Schedule
        </div>
        
        <div className="pl-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="promo-start-date" className="text-sm font-medium">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="promo-start-date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-end-date" className="text-sm font-medium">
              End Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="promo-end-date"
              type="datetime-local"
              value={formData.end_date}
              min={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="h-10"
            />
          </div>
        </div>
        {formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date) && (
          <p className="pl-6 text-xs text-destructive flex items-center gap-1">
            ⚠️ End date must be after start date
          </p>
        )}
      </div>
      
      {/* Item Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Tag className="w-4 h-4" />
          Select Items <span className="text-destructive">*</span>
        </div>
        
        <div className="pl-6">
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="mb-4 grid grid-cols-2 w-full">
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Courses ({formData.course_ids.length})
              </TabsTrigger>
              <TabsTrigger value="software" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Software ({formData.product_ids.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <div className="flex justify-end gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllCourses} className="h-7 text-xs">
                  Select All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAllCourses} className="h-7 text-xs">
                  Clear
                </Button>
              </div>
              
              {paidCourses.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">No paid courses available</p>
                </div>
              ) : (
                <>
                  <div className="max-h-52 overflow-y-auto border rounded-lg divide-y">
                    {paidCourses.map((course) => (
                      <label
                        key={course.id}
                        htmlFor={`course-${course.id}`}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          formData.course_ids.includes(course.id) ? 'bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={formData.course_ids.includes(course.id)}
                          onCheckedChange={() => toggleCourse(course.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{course.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">₹{course.price}</span>
                            {formData.course_ids.includes(course.id) && formData.discount_percentage > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                → ₹{Math.round((course.price || 0) * (1 - formData.discount_percentage / 100))}
                              </span>
                            )}
                          </div>
                        </div>
                        {formData.course_ids.includes(course.id) && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            -{formData.discount_percentage}%
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.course_ids.length} of {paidCourses.length} course(s) selected
                  </p>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="software">
              <div className="flex justify-end gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllSoftware} className="h-7 text-xs">
                  Select All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAllSoftware} className="h-7 text-xs">
                  Clear
                </Button>
              </div>
              
              {paidSoftware.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">No paid software available</p>
                </div>
              ) : (
                <>
                  <div className="max-h-52 overflow-y-auto border rounded-lg divide-y">
                    {paidSoftware.map((product) => (
                      <label
                        key={product.id}
                        htmlFor={`software-${product.id}`}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          formData.product_ids.includes(product.id) ? 'bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          id={`software-${product.id}`}
                          checked={formData.product_ids.includes(product.id)}
                          onCheckedChange={() => toggleSoftware(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">₹{product.price}</span>
                            {formData.product_ids.includes(product.id) && formData.discount_percentage > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                → ₹{Math.round((product.price || 0) * (1 - formData.discount_percentage / 100))}
                              </span>
                            )}
                          </div>
                        </div>
                        {formData.product_ids.includes(product.id) && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            -{formData.discount_percentage}%
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.product_ids.length} of {paidSoftware.length} product(s) selected
                  </p>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Submit Button */}
      <Button 
        onClick={onSubmit} 
        className="w-full h-11"
        disabled={
          !formData.name || 
          !formData.start_date || 
          !formData.end_date || 
          !hasItemsSelected ||
          new Date(formData.end_date) <= new Date(formData.start_date)
        }
      >
        {isEdit ? 'Update Promotion' : 'Create Promotion'}
      </Button>
    </div>
  );
}
