
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Filter, Plus, X, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FilterGroup {
  id: string;
  name: string;
  filters: Filter[];
  enabled: boolean;
}

interface Filter {
  id: string;
  type: 'skill' | 'experience' | 'education' | 'keyword' | 'location';
  value: string;
  weight: number;
  required: boolean;
}

const Filters: React.FC = () => {
  const { toast } = useToast();
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'fg-1',
      name: 'Software Engineer',
      enabled: true,
      filters: [
        { id: 'f-1', type: 'skill', value: 'JavaScript', weight: 80, required: true },
        { id: 'f-2', type: 'skill', value: 'React', weight: 90, required: true },
        { id: 'f-3', type: 'skill', value: 'TypeScript', weight: 70, required: false },
        { id: 'f-4', type: 'experience', value: '3+ years frontend development', weight: 85, required: true },
        { id: 'f-5', type: 'education', value: 'Computer Science degree', weight: 60, required: false },
      ]
    },
    {
      id: 'fg-2',
      name: 'Product Manager',
      enabled: false,
      filters: [
        { id: 'f-6', type: 'skill', value: 'Product Strategy', weight: 90, required: true },
        { id: 'f-7', type: 'skill', value: 'User Research', weight: 80, required: false },
        { id: 'f-8', type: 'skill', value: 'Agile Methodology', weight: 75, required: true },
        { id: 'f-9', type: 'experience', value: '5+ years product management', weight: 95, required: true },
      ]
    }
  ]);
  
  const [selectedGroup, setSelectedGroup] = useState<string | null>('fg-1');
  const [newFilterType, setNewFilterType] = useState<Filter['type']>('skill');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const currentGroup = filterGroups.find(group => group.id === selectedGroup);
  
  const handleToggleFilterGroup = (groupId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, enabled: !group.enabled } : group
    ));
    
    toast({
      title: "Filter group updated",
      description: `Filter group ${filterGroups.find(group => group.id === groupId)?.name} ${filterGroups.find(group => group.id === groupId)?.enabled ? 'disabled' : 'enabled'}`
    });
  };
  
  const handleAddFilter = () => {
    if (!newFilterValue.trim() || !selectedGroup) return;
    
    const newFilter: Filter = {
      id: `f-${Date.now()}`,
      type: newFilterType,
      value: newFilterValue,
      weight: 50,
      required: false
    };
    
    setFilterGroups(prev => prev.map(group => 
      group.id === selectedGroup 
        ? { ...group, filters: [...group.filters, newFilter] } 
        : group
    ));
    
    setNewFilterValue('');
    
    toast({
      title: "Filter added",
      description: `Added ${newFilterType} filter: ${newFilterValue}`
    });
  };
  
  const handleRemoveFilter = (filterId: string) => {
    if (!selectedGroup) return;
    
    const filterToRemove = filterGroups
      .find(group => group.id === selectedGroup)?.filters
      .find(filter => filter.id === filterId);
      
    setFilterGroups(prev => prev.map(group => 
      group.id === selectedGroup 
        ? { 
            ...group, 
            filters: group.filters.filter(filter => filter.id !== filterId) 
          } 
        : group
    ));
    
    toast({
      title: "Filter removed",
      description: `Removed ${filterToRemove?.type} filter: ${filterToRemove?.value}`
    });
  };
  
  const handleUpdateFilter = (filterId: string, updates: Partial<Filter>) => {
    if (!selectedGroup) return;
    
    setFilterGroups(prev => prev.map(group => 
      group.id === selectedGroup 
        ? { 
            ...group, 
            filters: group.filters.map(filter => 
              filter.id === filterId 
                ? { ...filter, ...updates } 
                : filter
            ) 
          } 
        : group
    ));
  };
  
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: FilterGroup = {
      id: `fg-${Date.now()}`,
      name: newGroupName,
      enabled: true,
      filters: []
    };
    
    setFilterGroups(prev => [...prev, newGroup]);
    setSelectedGroup(newGroup.id);
    setNewGroupName('');
    setIsCreatingGroup(false);
    
    toast({
      title: "Filter group created",
      description: `Created new filter group: ${newGroupName}`
    });
  };
  
  const handleDeleteGroup = (groupId: string) => {
    setFilterGroups(prev => prev.filter(group => group.id !== groupId));
    
    if (selectedGroup === groupId) {
      setSelectedGroup(filterGroups.length > 1 ? filterGroups[0].id : null);
    }
    
    toast({
      title: "Filter group deleted",
      description: `Deleted filter group: ${filterGroups.find(group => group.id === groupId)?.name}`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Candidate Filters</h1>
              <p className="text-gray-600">Create and manage filters for automatic candidate matching</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Groups Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Filter Groups</CardTitle>
                <CardDescription>
                  Create different filter sets for each job position
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filterGroups.map(group => (
                    <div
                      key={group.id}
                      className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedGroup === group.id ? 'bg-lens-purple/5 border-l-4 border-l-lens-purple' : ''
                      }`}
                      onClick={() => setSelectedGroup(group.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${group.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.filters.length} filters
                        </Badge>
                      </div>
                      {selectedGroup === group.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {isCreatingGroup ? (
                  <div className="p-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Group name" 
                        className="h-8 text-sm"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-lens-purple hover:bg-lens-purple/90"
                        onClick={handleAddGroup}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                          setIsCreatingGroup(false);
                          setNewGroupName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsCreatingGroup(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter Group
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Filter Content */}
            <div className="lg:col-span-3 space-y-6">
              {currentGroup ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-xl">{currentGroup.name}</CardTitle>
                        <CardDescription>
                          These filters will be applied to all CVs processed for this position
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentGroup.enabled}
                          onCheckedChange={() => handleToggleFilterGroup(currentGroup.id)}
                        />
                        <Label htmlFor="filter-active">{currentGroup.enabled ? 'Active' : 'Inactive'}</Label>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <select 
                            className="border rounded-md px-3 py-2 text-sm"
                            value={newFilterType}
                            onChange={(e) => setNewFilterType(e.target.value as Filter['type'])}
                          >
                            <option value="skill">Skill</option>
                            <option value="experience">Experience</option>
                            <option value="education">Education</option>
                            <option value="keyword">Keyword</option>
                            <option value="location">Location</option>
                          </select>
                          <Input 
                            placeholder="Filter value" 
                            className="col-span-2"
                            value={newFilterValue}
                            onChange={(e) => setNewFilterValue(e.target.value)}
                          />
                        </div>
                        <Button
                          className="bg-lens-purple hover:bg-lens-purple/90"
                          onClick={handleAddFilter}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Filter
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        {currentGroup.filters.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Filter className="h-12 w-12 mx-auto opacity-20 mb-2" />
                            <p>No filters added yet</p>
                            <p className="text-sm">Start by adding filters above</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-2">
                              <div className="col-span-3">Type</div>
                              <div className="col-span-4">Value</div>
                              <div className="col-span-2">Weight</div>
                              <div className="col-span-2">Required</div>
                              <div className="col-span-1"></div>
                            </div>
                            
                            {currentGroup.filters.map(filter => (
                              <div key={filter.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
                                <div className="col-span-3">
                                  <Badge className="capitalize">{filter.type}</Badge>
                                </div>
                                <div className="col-span-4 font-medium">{filter.value}</div>
                                <div className="col-span-2">
                                  <Slider
                                    value={[filter.weight]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                    onValueChange={(value) => handleUpdateFilter(filter.id, { weight: value[0] })}
                                  />
                                  <div className="text-xs text-center mt-1">{filter.weight}%</div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox 
                                    checked={filter.required} 
                                    onCheckedChange={(checked) => handleUpdateFilter(filter.id, { required: !!checked })}
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveFilter(filter.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Filter Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Minimum Match Score</Label>
                            <div className="flex items-center space-x-4">
                              <Slider
                                defaultValue={[70]}
                                min={0}
                                max={100}
                                step={5}
                                className="flex-1"
                              />
                              <span className="font-medium w-8 text-center">70%</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Auto-bin Candidates</Label>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Switch defaultChecked />
                                <span>80%+ to Bucket A</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch defaultChecked />
                                <span>60-79% to Bucket B</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch defaultChecked />
                                <span>Below 60% to Bucket C</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-end">
                    <Button className="bg-lens-purple hover:bg-lens-purple/90 gap-2">
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </Button>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Filter className="h-16 w-16 mx-auto opacity-20 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Filter Group Selected</h3>
                    <p className="text-gray-600 mb-4">
                      Select an existing filter group or create a new one to get started
                    </p>
                    <Button
                      className="bg-lens-purple hover:bg-lens-purple/90 mx-auto"
                      onClick={() => setIsCreatingGroup(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Filter Group
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Filters;
