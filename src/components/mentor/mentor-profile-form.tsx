"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOwnMentorProfile } from "@/features/mentor/actions";
import { linesToArray, arrayToLines } from "@/lib/slug";

export function MentorProfileForm({
  initial,
}: {
  initial: {
    full_name: string;
    bio: string;
    headline: string;
    expertise: string[];
    skills: string[];
    whatsapp: string;
    linkedin_url: string;
  };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name);
  const [bio, setBio] = useState(initial.bio);
  const [headline, setHeadline] = useState(initial.headline);
  const [expertise, setExpertise] = useState(arrayToLines(initial.expertise));
  const [skills, setSkills] = useState(arrayToLines(initial.skills));
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [linkedin, setLinkedin] = useState(initial.linkedin_url);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateOwnMentorProfile({
      full_name: fullName,
      bio,
      headline,
      expertise: linesToArray(expertise),
      skills: linesToArray(skills),
      whatsapp,
      linkedin_url: linkedin,
    });
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("Profile updated.");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Save profile
      </Button>
    </form>
  );
}
