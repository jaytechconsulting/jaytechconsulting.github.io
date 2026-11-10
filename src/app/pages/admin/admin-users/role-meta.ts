import type { AdminUserRole } from '../../../core/users/users.service';
import type { BadgeTone } from '../../../ui/data-display/badge/badge';

export const ROLE_META: Record<
  AdminUserRole,
  { label: string; tone: BadgeTone; color: string; icon: string; description: string }
> = {
  admin: {
    label: 'Administrador',
    tone: 'brand',
    color: '#FF6B35',
    icon: '⬢',
    description: 'Accesos segun los roles y permisos asignados.',
  },
  client: {
    label: 'Cliente',
    tone: 'info',
    color: '#22D3EE',
    icon: '◑',
    description: 'Acceso al portal de sus propios proyectos y tickets.',
  },
};
