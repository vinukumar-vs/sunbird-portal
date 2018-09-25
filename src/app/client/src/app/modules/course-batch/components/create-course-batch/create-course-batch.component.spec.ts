import { async, ComponentFixture, TestBed } from '@angular/core/testing';
<<<<<<< HEAD
import { SuiModule } from 'ng2-semantic-ui';
import { RouterTestingModule } from '@angular/router/testing';
=======
import {
  FormsModule, NgForm, FormBuilder, Validators, FormGroup, ReactiveFormsModule
} from '@angular/forms';
import { SuiModule } from 'ng2-semantic-ui';
>>>>>>> 93b2c23e943b9d66498a5779c674458fbceffc46
import { CreateCourseBatchComponent } from './create-course-batch.component';
import { FormsModule, NgForm, FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of as observableOf,
  throwError as observableThrowError,  Observable } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {SharedModule, ResourceService, ToasterService} from '@sunbird/shared';
import {CoreModule} from '@sunbird/core';
import {CourseBatchService} from '../../services';
import { UserService } from '@sunbird/core';
import { mockResponse } from './cretae-course-batch.component.spec.data';
class RouterStub {
  navigate = jasmine.createSpy('navigate');
}

const resourceServiceMockData = {
  messages: {
    imsg: { m0027: 'Something went wrong' },
    stmsg: { m0009: 'error' },
    smsg: {m0033 : 'Batch created sucessfully'},
    fmsg: {m0052: 'error'}
  },
  frmelmnts: {
    btn: {
      tryagain: 'tryagain',
      close: 'close'
    },
    lbl: {
      description: 'description',
      createnewbatch: ''
    }
  }
};
const fakeActivatedRoute = {
  'params': observableOf({ 'courseId': 'do_1125083286221291521153' }),
  'parent': { 'params': observableOf({ 'courseId': 'do_1125083286221291521153' }) },
  'snapshot': {
      params: [
        {
          courseId: 'do_1125083286221291521153',
        }
      ],
      data: {
        telemetry: {
        }
      }
    }
};

describe('CreateCourseBatchComponent', () => {
  let component: CreateCourseBatchComponent;
  let fixture: ComponentFixture<CreateCourseBatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
<<<<<<< HEAD
      declarations: [CreateCourseBatchComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [FormsModule, SharedModule.forRoot(), CoreModule.forRoot(), SuiModule, RouterTestingModule,
        HttpClientTestingModule, ],
      providers: [CourseBatchService, ToasterService, ResourceService,
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: fakeActivatedRoute }],
=======
      declarations: [ CreateCourseBatchComponent ],
      imports: [SuiModule, FormsModule, ReactiveFormsModule],
>>>>>>> 93b2c23e943b9d66498a5779c674458fbceffc46
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCourseBatchComponent);
    component = fixture.componentInstance;
  });

  it('should initialize the component expected calls for initializeFormFields and  fetchBatchDetails ', () => {
    const courseBatchService = TestBed.get(CourseBatchService);
    const toasterService = TestBed.get(ToasterService);
    const resourceService = TestBed.get(ResourceService);
    resourceService.messages = resourceServiceMockData.messages;
    resourceService.frmelmnts = resourceServiceMockData.frmelmnts;
    resourceService.messages = mockResponse.resourceBundle.messages;
    const userService = TestBed.get(UserService);
    spyOn(courseBatchService, 'getCourseHierarchy').and.
    returnValue(observableOf({createdBy: 'b2479136-8608-41c0-b3b1-283f38c338ed'}));
    spyOn(toasterService, 'success').and.callThrough();
    component.ngOnInit();
    expect(component.createBatchForm.status).toBe('INVALID');
    expect(component.courseCreator).toBeFalsy();
  });
  it('should create batch and show success message if api return success', () => {
    const courseBatchService = TestBed.get(CourseBatchService);
    const toasterService = TestBed.get(ToasterService);
    const resourceService = TestBed.get(ResourceService);
    resourceService.messages = resourceServiceMockData.messages;
    resourceService.frmelmnts = resourceServiceMockData.frmelmnts;
    resourceService.messages = mockResponse.resourceBundle.messages;
    const userService = TestBed.get(UserService);
    userService._userProfile = { organisationIds: [] };
    spyOn(courseBatchService, 'getUserList').and.returnValue(observableOf(mockResponse.getUserList));
    spyOn(courseBatchService, 'getCourseHierarchy').and.
    returnValue(observableOf({createdBy: 'b2479136-8608-41c0-b3b1-283f38c338ed'}));
    spyOn(courseBatchService, 'createBatch').and.returnValue(observableThrowError(mockResponse.createBatchDetails));
    spyOn(toasterService, 'success').and.callThrough();
    fixture.detectChanges();
    toasterService.success(resourceServiceMockData.messages.smsg.m0033);
    component.createBatchForm.value.startDate = new Date();
    component.createBatch();
    expect(component.createBatchForm).toBeDefined();
    expect(toasterService.success).toHaveBeenCalledWith(resourceServiceMockData.messages.smsg.m0033);
  });

});


