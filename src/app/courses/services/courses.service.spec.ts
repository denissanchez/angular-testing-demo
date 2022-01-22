import { CoursesService } from './courses.service';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { COURSES, findLessonsForCourse } from '../../../../server/db-data';
import { Course } from '../model/course';

describe('CourseService', () => {

  let coursesService: CoursesService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        CoursesService
      ]
    });

    coursesService = TestBed.inject(CoursesService);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should retrieve all courses', () => {
    coursesService.findAllCourses().subscribe({
      next: (courses) => {
        expect(courses).toBeTruthy('No courses returned');
        expect(courses.length).toBe(12, 'Incorrect number of courses');
        const course = courses.find(x => x.id === 12);
        expect(course.titles.description).toBe('Angular Testing Course');
      }
    });

    const req = httpController.expectOne('/api/courses');
    expect(req.request.method).toBe('GET');
    req.flush({payload: Object.values(COURSES)});
  });

  it('should find a course by id', () => {
    coursesService.findCourseById(12).subscribe({
      next: (course) => {
        expect(course).toBeTruthy();
        expect(course.id).toBe(12);
      }
    });

    const req = httpController.expectOne('/api/courses/12');
    expect(req.request.method).toBe('GET');
    req.flush(COURSES[12]);
  });

  it('should save the course data', () => {
    const changes: Partial<Course> = {
      titles: {
        description: 'Testing Course'
      }
    };

    coursesService.saveCourse(12, changes)
      .subscribe({
        next: (course) => {
          expect(course.id).toBe(12);
        }
      });

    const req = httpController.expectOne('/api/courses/12');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body.titles.description).toEqual(changes.titles.description);
    req.flush({...COURSES[12], ...changes});
  });

  it('should give an error if save course fails', () => {
    const changes: Partial<Course> = {
      titles: {
        description: 'Testing Course'
      }
    };

    coursesService.saveCourse(12, changes)
      .subscribe({
        next: () => {
          fail('The save course operation should have failed');
        },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(500);
        }
      });

    const req = httpController.expectOne('/api/courses/12');
    expect(req.request.method).toEqual('PUT');
    req.flush('Save course failed', {status: 500, statusText: 'Internal Server Error'});
  });

  it('should find a list of lessons', function () {
    coursesService.findLessons(12).subscribe({
      next: (lessons) => {
        expect(lessons).toBeTruthy();
        expect(lessons.length).toBe(3);
      }
    });

    const req = httpController.expectOne((r) => r.url === '/api/lessons');
    expect(req.request.method).toEqual('GET');
    expect(req.request.params.get('courseId')).toEqual('12');
    expect(req.request.params.get('filter')).toEqual('');
    expect(req.request.params.get('pageSize')).toEqual('3');

    req.flush({
      payload: findLessonsForCourse(12).slice(0, 3)
    });
  });

  afterEach(() => {
    httpController.verify();
  });
});
