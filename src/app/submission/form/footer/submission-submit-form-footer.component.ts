import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { isEmpty } from 'lodash';
import { SubmissionRestService } from '../../submission-rest.service';
import { SubmissionService } from '../../submission.service';
import { SubmissionState } from '../../submission.reducers';
import {
  ClearSectionErrorsAction,
  InertSectionErrorAction
} from '../../objects/submission-objects.actions';
import parseSectionErrorPaths, { SectionErrorPath } from '../../utils/parseSectionErrorPaths';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { submissionObjectSectionsFromIdSelector } from '../../selectors';

@Component({
  selector: 'ds-submission-submit-form-footer',
  styleUrls: [ './submission-submit-form-footer.component.scss' ],
  templateUrl: './submission-submit-form-footer.component.html'
})
export class SubmissionSubmitFormFooterComponent implements OnChanges {

  @Input() submissionId;

  private submissionIsInvalid = true;

  constructor(private modalService: NgbModal,
              private restService: SubmissionRestService,
              private router: Router,
              private submissionService: SubmissionService,
              private store: Store<SubmissionState>) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!this.submissionId) {
      this.submissionService.getSectionsState(this.submissionId)
        .subscribe((isValid) => {
          this.submissionIsInvalid = isValid === false;
        });
    }
  }

  saveLater() {


    /*this.store.select(submissionObjectSectionsFromIdSelector(this.submissionId))
      .subscribe((sectionsObject) => {
        Object.keys(sectionsObject).forEach((sectionId: string) => {
          const section = sectionsObject[ sectionId ];
          if (section.errors && !isEmpty(section.errors)) {
            console.log('\n\n\n\n\n\n\n\nclearing', section);
            const action = new ClearSectionErrorsAction(this.submissionId, sectionId);
            this.store.dispatch(action);
          }
        });
      });
*/

    this.restService.jsonPatchByResourceType(this.submissionId, 'sections')
      .subscribe((workspaceItem) => {

        // FIXME: the following code is a mock, fix it as soon as server return erros

        const workspaceItemMock = {
          errors: {
            'error.validation.one': {
              paths: [ '/sections/traditionalpageone/dc.title', '/sections/traditionalpageone/dc.identifier.citation' ]
            },
            'error.validation.test': {
              paths: [ '/sections/traditionalpagetwo/dc.description.sponsorship' ]
            },
            'error.validation.two': {
              paths: [ '/sections/traditionalpageone/dc.identifier.citation' ]
            },
            'Section error': {
              paths: [ '/sections/traditionalpageone/' ]
            }
          }
        };

        if (workspaceItemMock.errors) {
          Object.keys(workspaceItemMock.errors).forEach((messageKey: string) => {
            const paths: SectionErrorPath[] = parseSectionErrorPaths(workspaceItemMock.errors[ messageKey ].paths);

            paths.forEach((pathItem: SectionErrorPath) => {
              const error = { path: pathItem.originalPath, messageKey };
              const action = new InertSectionErrorAction(this.submissionId, pathItem.sectionId, error);

              this.store.dispatch(action);
            });
          });
        }
      });
  }

  public resourceDeposit() {
    alert('Feature is actually in development...');
  }

  protected resourceDiscard() {
    this.router.navigate([ 'home' ]);
  }

  public confirmDiscard(content) {
    this.modalService.open(content).result.then(
      (result) => {
        if (result === 'ok') {
          this.restService.deleteById(this.submissionId)
            .subscribe((response) => {
              this.resourceDiscard();
            })
        }
      }
    );
  }
}
