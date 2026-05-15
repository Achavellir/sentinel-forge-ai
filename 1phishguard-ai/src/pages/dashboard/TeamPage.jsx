import { useState } from 'react';
import { MailPlus, Trash2, UserRoundCheck } from 'lucide-react';
import { DashboardHeader, LockedBusiness } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Badge, Button, Card, Field, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const initialMembers = [
  { id: '1', name: 'Avery Kim', email: 'avery@company.com', role: 'Owner' },
  { id: '2', name: 'Morgan Lee', email: 'morgan@company.com', role: 'Admin' },
  { id: '3', name: 'Sam Patel', email: 'sam@company.com', role: 'Member' },
];

export default function TeamPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');

  if (profile?.plan !== 'business') {
    return (
      <>
        <SEO title="Team" description="Business team management for 1PhishGuard AI." />
        <LockedBusiness />
      </>
    );
  }

  function handleInvite(event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    toast.success(`Invitation prepared for ${inviteEmail}.`);
    setInviteEmail('');
  }

  return (
    <>
      <SEO title="Team" description="Manage 1PhishGuard AI team members and roles." />
      <DashboardHeader
        eyebrow="Business workspace"
        title="Team"
        description="Invite teammates and manage security workflow access."
      />
      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <h2 className="text-xl font-black text-white">Invite member</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleInvite}>
            <Field label="Email" error={error}>
              <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" />
            </Field>
            <Button type="submit">
              <MailPlus className="h-4 w-4" /> Invite Member
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-white">Members</h2>
          <div className="mt-5 grid gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan/10 text-cyan">
                    <UserRoundCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-white">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-primary/40 bg-primary/10 text-blue-200">{member.role}</Badge>
                  {member.role !== 'Owner' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
