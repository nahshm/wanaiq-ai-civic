import { Badge } from '@/components/ui/badge';
import { Building2, UserCheck, Users } from 'lucide-react';
import { ProjectEntity } from '@/hooks/useProjects';

interface EntityBadgeProps {
    entity: ProjectEntity;
    type: 'official' | 'institution';
    variant?: 'default' | 'outline' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export function EntityBadge({
    entity,
    type,
    variant = 'secondary',
    size = 'md',
    showIcon = true
}: EntityBadgeProps) {
    // Safety check - return null if entity is undefined
    if (!entity) return null;

    // Handle different field names: officials use 'title', institutions use 'name'
    const displayName = type === 'official'
        ? (entity.title || entity.name || 'Unknown Official')
        : (entity.name || entity.title || 'Unknown Institution');

    const Icon = type === 'official' ? UserCheck : Building2;

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5'
    };

    return (
        <Badge variant={variant} className={`gap-1 ${sizeClasses[size]}`}>
            {showIcon && <Icon className="w-3 h-3" />}
            {displayName}
            {entity.acronym && ` (${entity.acronym})`}
        </Badge>
    );
}

interface EntityListProps {
    primaryType: 'official' | 'institution';
    primaryEntity: ProjectEntity | null;
    collaboratingOfficials?: { official: ProjectEntity }[];
    collaboratingInstitutions?: { institution: ProjectEntity }[];
    maxCollaborators?: number;
    showLabel?: boolean;
}

export function EntityList({
    primaryType,
    primaryEntity,
    collaboratingOfficials = [],
    collaboratingInstitutions = [],
    maxCollaborators = 3,
    showLabel = true
}: EntityListProps) {
    // Safely handle collaborator arrays
    const safeOfficials = Array.isArray(collaboratingOfficials) ? collaboratingOfficials : [];
    const safeInstitutions = Array.isArray(collaboratingInstitutions) ? collaboratingInstitutions : [];

    const allCollaborators = [
        ...safeOfficials
            .filter(c => c && c.official) // Filter out undefined
            .map(c => ({ entity: c.official, type: 'official' as const })),
        ...safeInstitutions
            .filter(c => c && c.institution) // Filter out undefined
            .map(c => ({ entity: c.institution, type: 'institution' as const }))
    ];

    const visibleCollaborators = allCollaborators.slice(0, maxCollaborators);
    const hiddenCount = allCollaborators.length - visibleCollaborators.length;

    if (!primaryEntity && allCollaborators.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                No responsible entity assigned
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {primaryEntity && (
                <div className="flex items-center gap-2 flex-wrap">
                    {showLabel && (
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                            Primary:
                        </span>
                    )}
                    <EntityBadge entity={primaryEntity} type={primaryType} variant="default" />
                </div>
            )}

            {allCollaborators.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {showLabel && (
                        <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            With:
                        </span>
                    )}
                    {visibleCollaborators.map((collab, idx) => (
                        <EntityBadge
                            key={`${collab.type}-${idx}`}
                            entity={collab.entity}
                            type={collab.type}
                            variant="outline"
                            size="sm"
                        />
                    ))}
                    {hiddenCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                            +{hiddenCount} more
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
