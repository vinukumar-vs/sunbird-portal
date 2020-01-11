import { TelemetryService } from '@sunbird/telemetry';
import { actionButtons } from './actionButtons';
import { Router, ActivatedRoute } from '@angular/router';
import { ResourceService, ToasterService, OfflineCardService, NavigationHelperService } from '@sunbird/shared';
import { PublicPlayerService } from '@sunbird/public';
import { ContentManagerService, ConnectionService } from '@sunbird/offline';
import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject} from 'rxjs';
import * as _ from 'lodash-es';

@Component({
  selector: 'app-content-actions',
  templateUrl: './content-actions.component.html',
  styleUrls: ['./content-actions.component.scss']
})
export class ContentActionsComponent implements OnInit, OnChanges {
  @Input() contentData;
  @Input() showUpdate;
  @Output() deletedContent = new EventEmitter();
  @Output() contentDownloaded = new EventEmitter();
  actionButtons = actionButtons;
  contentRatingModal = false;
  contentId;
  collectionId;
  showExportLoader = false;
  showModal = false;
  showDeleteModal = false;
  private isConnected;
  public unsubscribe$ = new Subject<void>();

  constructor(
    private contentManagerService: ContentManagerService,
    private playerService: PublicPlayerService,
    private connectionService: ConnectionService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public resourceService: ResourceService,
    public toasterService: ToasterService,
    public offlineCardService: OfflineCardService,
    public navigationHelperService: NavigationHelperService,
    private telemetryService: TelemetryService
  ) { }

  ngOnInit() {
    this.collectionId = _.get(this.activatedRoute.snapshot.params, 'collectionId');
    this.contentManagerService.downloadListEvent.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.checkDownloadStatus(data);
    });
    this.checkOnlineStatus();
  }

  checkOnlineStatus() {
    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
        this.changeContentStatus(this.contentData);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.checkOnlineStatus();
    if (!changes.contentData.firstChange) {
      this.contentData = changes.contentData.currentValue;
      this.changeContentStatus(this.contentData);
    }
  }

  changeContentStatus(content) {
    if (content) {
      _.forEach(this.actionButtons, data => {
        const disableButton = ['DOWNLOADED', 'DOWNLOADING', 'PAUSED', 'PAUSING'];
        if (data.name === 'download') {
          const downloadLabel = _.includes(disableButton, _.get(content, 'downloadStatus')) ? _.get(content, 'downloadStatus') :
          _.get(content, 'desktopAppMetadata.isAvailable') ? 'Downloaded' : 'Download';
          const status = ((_.isEqual(downloadLabel, 'Download') ? false : true) || !this.isConnected);
          this.changeLabel(data, status, downloadLabel);
        } else if (data.name === 'update') {
          this.changeLabel(data, !(_.get(content, 'desktopAppMetadata.updateAvailable') && this.isConnected), data.name);
        } else if (data.name !== 'rate') {
          const disabled = !(_.get(content, 'desktopAppMetadata.isAvailable') || _.isEqual(_.get(content, 'downloadStatus'), 'DOWNLOADED'));
          this.changeLabel(data, disabled, data.name);
        }
      });
    }
  }

  changeLabel(data, disabled, label) {
      data.disabled = disabled;
      data.label = _.capitalize(label);
  }

  checkDownloadStatus(downloadListdata) {
    const content = this.playerService.updateDownloadStatus(downloadListdata, this.contentData);
    this.contentData = content;
    if (_.isEqual(_.get(content, 'downloadStatus'), 'DOWNLOADED')) {
      this.contentDownloaded.emit(content);
    }
    this.changeContentStatus(content);
}

  onActionButtonClick(event, content) {
    switch (event.data.name.toUpperCase()) {
      case 'UPDATE':
        this.updateContent(content);
        this.logTelemetry('update-content');
        break;
      case 'DOWNLOAD':
        this.isYoutubeContentPresent(content);
        this.logTelemetry('is-youtube-content');
        break;
      case 'DELETE':
        this.showDeleteModal = true;
        this.logTelemetry('confirm-delete-content');
        break;
      case 'RATE':
        this.contentRatingModal = true;
        this.logTelemetry('rate-content');
        break;
      case 'SHARE':
        this.exportContent(content);
        this.logTelemetry('share-content');
        break;
    }
  }

  isYoutubeContentPresent(content) {
    this.showModal = this.offlineCardService.isYoutubeContent(content);
    if (!this.showModal) {
      this.downloadContent(content);
    }
  }

  downloadContent(content) {
    this.logTelemetry('download-content');
    this.contentData['downloadStatus'] = this.resourceService.messages.stmsg.m0140;
    this.changeContentStatus(content);
    this.contentManagerService.downloadContentId = content.identifier;
    this.contentManagerService.startDownload({}).subscribe(data => {
      this.contentManagerService.downloadContentId = '';
      this.contentData['downloadStatus'] = this.resourceService.messages.stmsg.m0140;
      this.changeContentStatus(content);
    }, (error) => {
      this.contentManagerService.downloadContentId = '';
      this.contentData['downloadStatus'] = this.resourceService.messages.stmsg.m0138;
      this.changeContentStatus(this.contentData);
      this.toasterService.error(this.resourceService.messages.fmsg.m0090);
    });

  }

  updateContent(content) {
    this.contentData.desktopAppMetadata['updateAvailable'] = false;
    this.changeContentStatus(content);
    const request = !_.isEmpty(this.collectionId) ? { contentId: content.identifier, parentId: this.collectionId } :
      { contentId: this.contentId };
    this.contentManagerService.updateContent(request).pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.changeContentStatus(content);
    }, (err) => {
      this.changeContentStatus(content);
      const errorMessage = !this.isConnected ? _.replace(this.resourceService.messages.smsg.m0056, '{contentName}',
        content.name) :
        this.resourceService.messages.fmsg.m0096;
      this.toasterService.error(errorMessage);
    });
  }

  deleteContent(content) {
  this.logTelemetry('delete-content');
  const request = !_.isEmpty(this.collectionId) ? {request: {contents: [content.identifier], visibility: 'Parent'}} :
    {request: {contents: [content.identifier]}};
    this.contentManagerService.deleteContent(request).subscribe(data => {
    if (!_.isEmpty(_.get(data, 'result.deleted'))) {
      this.contentData.desktopAppMetadata['isAvailable'] = false ;
      delete content['downloadStatus'];
      this.changeContentStatus(content);
      this.deletedContent.emit(content);
      this.toasterService.success(this.resourceService.messages.stmsg.desktop.deleteSuccessMessage);
    } else {
      this.toasterService.error(this.resourceService.messages.stmsg.desktop.deleteErrorMessage);
    }
    }, err => {
    this.changeContentStatus(content);
      this.toasterService.error(this.resourceService.messages.stmsg.desktop.deleteErrorMessage);
    });
  }

  exportContent(content) {
    this.showExportLoader = true;
    this.contentManagerService.exportContent(content.identifier)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.showExportLoader = false;
        this.toasterService.success(this.resourceService.messages.smsg.m0059);
      }, error => {
        this.showExportLoader = false;
        if (_.get(error, 'error.responseCode') !== 'NO_DEST_FOLDER') {
          this.toasterService.error(this.resourceService.messages.fmsg.m0091);
        }
      });
  }

  logTelemetry(id) {
      const interactData = {
        context: {
          env: _.get(this.activatedRoute.snapshot.data.telemetry, 'env') || 'content',
          cdata: []
        },
        edata: {
          id: id,
          type: 'click',
          pageid: _.get(this.activatedRoute.snapshot.data.telemetry, 'pageid') || 'play-content',
        }
      };
      this.telemetryService.interact(interactData);
  }

}
