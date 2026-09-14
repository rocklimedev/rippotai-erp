import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectPhase } from '../projects/models/project-phase.model';
import { DocumentType } from './models/document-type.model';
import { Document } from './models/document.model';
import { Project } from '../projects/models/projects.model';

@Injectable()
export class ProjectDocumentPhaseService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(ProjectPhase)
    private readonly projectPhaseModel: typeof ProjectPhase,

    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,

    @InjectModel(Document)
    private readonly documentModel: typeof Document,
  ) {
    console.log('\n========== DOCUMENT MODEL DEBUG ==========');

    console.log('TABLE:', this.documentModel.getTableName());

    console.log(
      'createdAt FIELD:',
      this.documentModel.rawAttributes.createdAt?.field,
    );

    console.log(
      'updatedAt FIELD:',
      this.documentModel.rawAttributes.updatedAt?.field,
    );

    console.log(
      'createdAt ATTRIBUTE:',
      this.documentModel.rawAttributes.createdAt,
    );

    console.log(
      'updatedAt ATTRIBUTE:',
      this.documentModel.rawAttributes.updatedAt,
    );

    console.log('==========================================\n');
  }
  /**
   * Returns the complete document ch`ecklist tree:
   *
   * ALL PROJECTS
   *   └── DOCUMENT PHASES
   *        └── DOCUMENT TYPES
   *             └── uploaded document status
   *
   * The frontend can use the same response whether
   * a project is selected or "All Projects" is selected.
   */
  async getAllProjectsDocumentPhaseTree() {
    /* ============================================================
       PROJECTS
    ============================================================ */

    const projects = await this.projectModel.findAll({
      order: [['name', 'ASC']],
    });

    /* ============================================================
       DOCUMENT PHASES
    ============================================================ */

    const phases = await this.projectPhaseModel.findAll({
      where: {
        module: 'DOCUMENTS',
      },
      order: [
        ['sort_order', 'ASC'],
        ['phase_number', 'ASC'],
      ],
    });

    /* ============================================================
       DOCUMENT TYPES
    ============================================================ */

    const documentTypes = await this.documentTypeModel.findAll({
      where: {
        isActive: true,
      },
      include: [
        {
          model: this.projectPhaseModel,
          as: 'projectPhase',
          required: true,
          where: {
            module: 'DOCUMENTS',
          },
        },
      ],
      order: [
        ['phaseCode', 'ASC'],
        ['sequence', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    /* ============================================================
       PROJECT DOCUMENTS
    ============================================================ */

    const documents = await this.documentModel.findAll({
      attributes: [
        'id',
        'projectId',
        'documentTypeId',
        'title',
        'filename',
        'version',
        'status',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    /* ============================================================
       GROUP DOCUMENTS
       
       projectId
          └── documentTypeId
               └── documents[]
    ============================================================ */

    const documentsByProject = new Map<string, Map<string, any[]>>();

    for (const document of documents) {
      const projectId = document.projectId;
      const documentTypeId = document.documentTypeId;

      if (!projectId || !documentTypeId) {
        continue;
      }

      if (!documentsByProject.has(projectId)) {
        documentsByProject.set(projectId, new Map());
      }

      const projectDocuments = documentsByProject.get(projectId)!;

      if (!projectDocuments.has(documentTypeId)) {
        projectDocuments.set(documentTypeId, []);
      }

      projectDocuments.get(documentTypeId)!.push(document);
    }

    /* ============================================================
       GROUP DOCUMENT TYPES BY PHASE
    ============================================================ */

    const documentTypesByPhase = new Map<string, any[]>();

    for (const documentType of documentTypes) {
      const projectPhaseId = documentType.projectPhaseId;

      if (!projectPhaseId) {
        continue;
      }

      if (!documentTypesByPhase.has(projectPhaseId)) {
        documentTypesByPhase.set(projectPhaseId, []);
      }

      documentTypesByPhase.get(projectPhaseId)!.push(documentType);
    }

    /* ============================================================
       BUILD PROJECT TREE
    ============================================================ */

    const projectTrees = projects.map((project) => {
      const projectId = project.id;

      const projectDocumentMap =
        documentsByProject.get(projectId) || new Map<string, any[]>();

      let totalDocuments = 0;
      let uploadedDocuments = 0;

      let requiredDocuments = 0;
      let uploadedRequiredDocuments = 0;

      const projectPhases = phases.map((phase) => {
        const phaseId = phase.id;

        const phaseDocumentTypes = documentTypesByPhase.get(phaseId) || [];

        const documentsForPhase = phaseDocumentTypes.map((documentType) => {
          const uploaded = projectDocumentMap.get(documentType.id) || [];

          const isUploaded = uploaded.length > 0;

          const requirementType = String(
            documentType.requirementType || 'REQUIRED',
          ).toUpperCase();

          const isRequired = requirementType === 'REQUIRED';

          totalDocuments += 1;

          if (isUploaded) {
            uploadedDocuments += 1;
          }

          if (isRequired) {
            requiredDocuments += 1;

            if (isUploaded) {
              uploadedRequiredDocuments += 1;
            }
          }

          return {
            id: documentType.id,

            code: documentType.code,

            name: documentType.name,

            description: documentType.description || null,

            sequence: documentType.sequence,

            targetType: documentType.targetType,

            requirementType,

            allowsMultiple: Boolean(documentType.allowsMultiple),

            requiresRevision: Boolean(documentType.requiresRevision),

            requiresApproval: Boolean(documentType.requiresApproval),

            projectPhaseId: documentType.projectPhaseId,

            phaseCode: documentType.phaseCode,

            phaseName: documentType.phaseName,

            isUploaded,

            uploadCount: uploaded.length,

            documentIds: uploaded.map((document) => document.id),

            latestDocumentId: uploaded[0]?.id || null,

            latestUploadedAt:
              uploaded[0]?.createdAt || uploaded[0]?.updatedAt || null,

            documents: uploaded.map((document) => ({
              id: document.id,
              title: document.title,
              filename: document.filename,
              version: document.version,
              status: document.status,
              createdAt: document.createdAt,
              updatedAt: document.updatedAt,
            })),
          };
        });

        const total = documentsForPhase.length;

        const uploaded = documentsForPhase.filter(
          (item) => item.isUploaded,
        ).length;

        const pending = total - uploaded;

        const required = documentsForPhase.filter(
          (item) => item.requirementType === 'REQUIRED',
        ).length;

        const uploadedRequired = documentsForPhase.filter(
          (item) => item.requirementType === 'REQUIRED' && item.isUploaded,
        ).length;

        const pendingRequired = required - uploadedRequired;

        const completionPercentage =
          total > 0 ? Math.round((uploaded / total) * 100) : 100;

        const requiredCompletionPercentage =
          required > 0 ? Math.round((uploadedRequired / required) * 100) : 100;

        return {
          id: phase.id,

          phaseNumber: phase.phase_number,

          phaseCode: phase.phase_code,

          title: phase.title,

          description: phase.description,

          sortOrder: phase.sort_order,

          isComplete: pendingRequired === 0,

          summary: {
            total,
            uploaded,
            pending,

            required,
            uploadedRequired,
            pendingRequired,

            completionPercentage,
            requiredCompletionPercentage,
          },

          documents: documentsForPhase,
        };
      });

      const pendingDocuments = totalDocuments - uploadedDocuments;

      const pendingRequiredDocuments =
        requiredDocuments - uploadedRequiredDocuments;

      return {
        id: project.id,

        name: project.name || project.id,

        phases: projectPhases,

        summary: {
          totalPhases: projectPhases.length,

          completedPhases: projectPhases.filter((phase) => phase.isComplete)
            .length,

          pendingPhases: projectPhases.filter((phase) => !phase.isComplete)
            .length,

          totalDocuments,

          uploadedDocuments,

          pendingDocuments,

          requiredDocuments,

          uploadedRequiredDocuments,

          pendingRequiredDocuments,

          completionPercentage:
            totalDocuments > 0
              ? Math.round((uploadedDocuments / totalDocuments) * 100)
              : 100,

          requiredCompletionPercentage:
            requiredDocuments > 0
              ? Math.round(
                  (uploadedRequiredDocuments / requiredDocuments) * 100,
                )
              : 100,
        },
      };
    });

    /* ============================================================
       GLOBAL SUMMARY
    ============================================================ */

    const totalProjects = projectTrees.length;

    const completedProjects = projectTrees.filter(
      (project) => project.summary.pendingRequiredDocuments === 0,
    ).length;

    const totalDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.totalDocuments,
      0,
    );

    const uploadedDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.uploadedDocuments,
      0,
    );

    const pendingDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.pendingDocuments,
      0,
    );

    const requiredDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.requiredDocuments,
      0,
    );

    const uploadedRequiredDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.uploadedRequiredDocuments,
      0,
    );

    const pendingRequiredDocuments = projectTrees.reduce(
      (sum, project) => sum + project.summary.pendingRequiredDocuments,
      0,
    );

    return {
      projects: projectTrees,

      summary: {
        totalProjects,

        completedProjects,

        pendingProjects: totalProjects - completedProjects,

        totalDocuments,

        uploadedDocuments,

        pendingDocuments,

        requiredDocuments,

        uploadedRequiredDocuments,

        pendingRequiredDocuments,

        completionPercentage:
          totalDocuments > 0
            ? Math.round((uploadedDocuments / totalDocuments) * 100)
            : 100,

        requiredCompletionPercentage:
          requiredDocuments > 0
            ? Math.round((uploadedRequiredDocuments / requiredDocuments) * 100)
            : 100,
      },
    };
  }
  /**
   * Returns the complete document checklist for a project.
   *
   * Structure:
   *
   * Project
   *   └── Document Phases
   *         └── Document Types
   *               └── Uploaded Documents
   */
  async getProjectDocumentPhaseList(projectId: string) {
    /*
     * Load all DOCUMENTS phases.
     *
     * We deliberately use the ProjectPhase master table as the
     * source of truth rather than deriving phases from document_types.
     */
    const phases = await this.projectPhaseModel.findAll({
      where: {
        module: 'DOCUMENTS',
      },
      order: [
        ['sort_order', 'ASC'],
        ['phase_number', 'ASC'],
      ],
    });

    /*
     * Load every document type belonging to the DOCUMENTS module.
     *
     * projectPhaseId is now the authoritative relationship.
     */
    const documentTypes = await this.documentTypeModel.findAll({
      where: {
        isActive: true,
      },
      include: [
        {
          model: ProjectPhase,
          as: 'projectPhase',
          required: true,
          where: {
            module: 'DOCUMENTS',
          },
        },
      ],
      order: [['sequence', 'ASC']],
    });

    /*
     * Load every document uploaded against this project.
     *
     * IMPORTANT:
     * We only need the relationship fields here to build the
     * checklist. This keeps the query lightweight.
     */
    const uploadedDocuments = await this.documentModel.findAll({
      where: {
        projectId,
      },
      attributes: ['id', 'documentTypeId', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    /*
     * Group uploaded documents by documentTypeId.
     *
     * Example:
     *
     * {
     *   "document-type-id-1": [document1, document2],
     *   "document-type-id-2": [document3]
     * }
     */
    const uploadedByDocumentType = new Map<string, Document[]>();

    for (const document of uploadedDocuments) {
      const documentTypeId = document.documentTypeId;

      if (!documentTypeId) {
        continue;
      }

      const existing = uploadedByDocumentType.get(documentTypeId) ?? [];

      existing.push(document);

      uploadedByDocumentType.set(documentTypeId, existing);
    }

    /*
     * Group document types by projectPhaseId.
     */
    const documentTypesByPhase = new Map<string, DocumentType[]>();

    for (const documentType of documentTypes) {
      const projectPhaseId = documentType.projectPhaseId;

      if (!projectPhaseId) {
        continue;
      }

      const existing = documentTypesByPhase.get(projectPhaseId) ?? [];

      existing.push(documentType);

      documentTypesByPhase.set(projectPhaseId, existing);
    }

    /*
     * Build the final project document/phase tree.
     */
    const phaseResults = phases.map((phase) => {
      const phaseDocumentTypes = documentTypesByPhase.get(phase.id) ?? [];

      const documents = phaseDocumentTypes.map((documentType) => {
        const uploaded = uploadedByDocumentType.get(documentType.id) ?? [];

        const isUploaded = uploaded.length > 0;

        return {
          id: documentType.id,
          code: documentType.code,
          name: documentType.name,

          projectPhaseId: documentType.projectPhaseId,

          phaseCode: documentType.phaseCode,

          phaseName: documentType.phaseName,

          sectionCode: documentType.sectionCode,

          sectionName: documentType.sectionName,

          sequence: documentType.sequence,

          targetType: documentType.targetType,

          requirementType: documentType.requirementType,

          allowsMultiple: documentType.allowsMultiple,

          requiresRevision: documentType.requiresRevision,

          requiresApproval: documentType.requiresApproval,

          description: documentType.description,

          isActive: documentType.isActive,

          /*
           * Project-specific upload state.
           */
          isUploaded,

          uploadCount: uploaded.length,

          documentIds: uploaded.map((document) => document.id),

          latestDocumentId: uploaded[0]?.id ?? null,

          latestUploadedAt: uploaded[0]?.createdAt ?? null,
        };
      });

      const total = documents.length;

      const uploadedCount = documents.filter(
        (document) => document.isUploaded,
      ).length;

      const pendingCount = total - uploadedCount;

      const requiredDocuments = documents.filter(
        (document) => document.requirementType === 'REQUIRED',
      );

      const uploadedRequiredDocuments = requiredDocuments.filter(
        (document) => document.isUploaded,
      );

      const completionPercentage =
        total === 0 ? 100 : Math.round((uploadedCount / total) * 100);

      const requiredCompletionPercentage =
        requiredDocuments.length === 0
          ? 100
          : Math.round(
              (uploadedRequiredDocuments.length / requiredDocuments.length) *
                100,
            );

      /*
       * A phase is considered complete only when all
       * REQUIRED document types have at least one upload.
       */
      const isComplete =
        requiredDocuments.length === 0 ||
        uploadedRequiredDocuments.length === requiredDocuments.length;

      return {
        id: phase.id,

        module: phase.module,

        phaseNumber: phase.phase_number,

        phaseCode: phase.phase_code,

        title: phase.title,

        description: phase.description,

        sortOrder: phase.sort_order,

        isComplete,

        summary: {
          total,
          uploaded: uploadedCount,
          pending: pendingCount,

          required: requiredDocuments.length,

          uploadedRequired: uploadedRequiredDocuments.length,

          pendingRequired:
            requiredDocuments.length - uploadedRequiredDocuments.length,

          completionPercentage,

          requiredCompletionPercentage,
        },

        documents,
      };
    });

    /*
     * Overall project-level summary.
     */
    const allDocuments = phaseResults.flatMap((phase) => phase.documents);

    const totalDocuments = allDocuments.length;

    const uploadedDocumentsCount = allDocuments.filter(
      (document) => document.isUploaded,
    ).length;

    const pendingDocumentsCount = totalDocuments - uploadedDocumentsCount;

    const requiredDocuments = allDocuments.filter(
      (document) => document.requirementType === 'REQUIRED',
    );

    const uploadedRequiredDocuments = requiredDocuments.filter(
      (document) => document.isUploaded,
    );

    const completedPhases = phaseResults.filter(
      (phase) => phase.isComplete,
    ).length;

    return {
      projectId,

      summary: {
        totalPhases: phaseResults.length,

        completedPhases,

        pendingPhases: phaseResults.length - completedPhases,

        totalDocuments,

        uploadedDocuments: uploadedDocumentsCount,

        pendingDocuments: pendingDocumentsCount,

        requiredDocuments: requiredDocuments.length,

        uploadedRequiredDocuments: uploadedRequiredDocuments.length,

        pendingRequiredDocuments:
          requiredDocuments.length - uploadedRequiredDocuments.length,

        completionPercentage:
          totalDocuments === 0
            ? 100
            : Math.round((uploadedDocumentsCount / totalDocuments) * 100),

        requiredCompletionPercentage:
          requiredDocuments.length === 0
            ? 100
            : Math.round(
                (uploadedRequiredDocuments.length / requiredDocuments.length) *
                  100,
              ),
      },

      phases: phaseResults,
    };
  }
}
