"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveMentor } from "@/features/admin/mentor-actions";
import { linesToArray, arrayToLines } from "@/lib/slug";

export function MentorForm({
  initial,
}: {
  initial: {
    id: string;
    full_name: string;
    bio: string;
    headline: string;
    expertise: string[];
    skills: string[];
    years_experience: number;
    whatsapp: string;
    linkedin_url: string;
    is_featured: boolean;
    is_verified: boolean;
  };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name);
  const [bio, setBio] = useState(initial.bio);
  const [headline, setHeadline] = useState(initial.headline);
  const [expertise, setExpertise] = useState(arrayToLines(initial.expertise));
  const [skills, setSkills] = useState(arrayToLines(initial.skills));
  const [years, setYears] = useState(String(initial.years_experience || ""));
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [linkedin, setLinkedin] = useState(initial.linkedin_url);
  const [featured, setFeatured] = useState(initial.is_featured);
  const [verified, setVerified] = useState(initial.is_verified);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await saveMentor({
      id: initial.id,
      full_name: fullName,
      bio,
      headline,
      expertise: linesToArray(expertise),
      skills: linesToArray(skills),
      years_experience: Number(years) || 0,
      whatsapp,
      linkedin_url: linkedin,
      is_featured: featured,
      is_verified: verified,
    });
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("Mentor saved.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Full-Stack Developer & Mentor"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expertise">Expertise (one per line)</Label>
          <Textarea
            id="expertise"
            rows={3}
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skills">Skills (one per line)</Label>
          <Textarea
            id="skills"
            rows={3}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="years">Years experience</Label>
          <Input
            id="years"
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={verified} onCheckedChange={setVerified} id="verified" />
          <Label htmlFor="verified">Verified</Label>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Save mentor
      </Button>
    </form>
  );
}
