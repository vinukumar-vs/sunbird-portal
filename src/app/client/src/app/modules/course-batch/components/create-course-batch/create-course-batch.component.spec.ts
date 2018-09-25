import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormsModule, NgForm, FormBuilder, Validators, FormGroup, ReactiveFormsModule
} from '@angular/forms';
import { SuiModule } from 'ng2-semantic-ui';
import { CreateCourseBatchComponent } from './create-course-batch.component';
import {SharedModule, ResourceService} from '@sunbird/shared';
describe('CreateCourseBatchComponent', () => {
  let component: CreateCourseBatchComponent;
  let fixture: ComponentFixture<CreateCourseBatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCourseBatchComponent ],
      imports: [SharedModule.forRoot(), SuiModule, FormsModule, ReactiveFormsModule],
      providers: [ResourceService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCourseBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
