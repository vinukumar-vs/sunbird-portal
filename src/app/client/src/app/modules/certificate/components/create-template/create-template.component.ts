import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import * as _ from 'lodash-es';
import { UploadCertificateService } from '../../services/upload-certificate/upload-certificate.service';
import { MockData } from './create-template.component.data';
import { FormGroup, FormControl } from '@angular/forms';
import { UserService } from '@sunbird/core';
import { ToasterService, ResourceService } from '@sunbird/shared';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-create-template',
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss']
})
export class CreateTemplateComponent implements OnInit {

  public unsubscribe$ = new Subject<void>();
  // userPreference: FormGroup;
  selectStateOption: any = [];
  selectLanguageOption: any = [];
  selectState: any;
  selectLanguage: any;
  showSelectImageModal;
  showUploadUserModal;


  imagesList = [];
  imageName: any;
  uploadForm: FormGroup;
  fileObj: any;
  certLogos: any = [];
  selectedLogo: any;
  certSigns: any = [];
  logoType;
  defaultCertificates = [
    { path: 'assets/images/certificate-frame.svg' },
    { path: 'assets/images/certificate-frame.svg' },
    { path: 'assets/images/certificate-frame.svg' }]
  selectedCertificate: any;
  svgFile;
  logoHtml;
  svgData;
  center = 150;

  constructor(public uploadCertificateService: UploadCertificateService,
    public userService: UserService,
    private sanitizer: DomSanitizer,
    public toasterService: ToasterService,
    public resourceService: ResourceService) {
    this.uploadForm = new FormGroup({
      assetCaption: new FormControl(''),
      tags: new FormControl(''),
      language: new FormControl(''),
      creator: new FormControl(''),
      creatorId: new FormControl('')
    })
  }

  ngOnInit() {
    // this.selectStateOption = [
    //   {
    //     name: 'Karnataka',
    //     value: '0'
    //   },
    //   {
    //     name: 'Maharashtra',
    //     value: '1'
    //    },
    //    {
    //     name: 'Tamil Nadu',
    //     value: '2'
    //   },
    //   {
    //     name: 'Andhra Pradesh',
    //     value: '3'
    //    },
    // ];
    // this.selectLanguageOption = [
    //   {
    //     name: 'All',
    //     value: '0'
    //   },
    //   {
    //     name: 'hindi',
    //     value: '1'
    //    },
    //    {
    //     name: 'English',
    //     value: '2'
    //   }
    // ];

    this.selectedCertificate = this.defaultCertificates[0];
    this.getSVGTemplate()
    const img = new Image();
    img.src = "https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_21299382129774592011428/artifact/0_d4u2l9.png";
    const data =this.getBase64Data(img);
    console.log(data)
    this.uploadCertificateService.getAssetData().subscribe(res => {
      console.log(res)
      this.imagesList = MockData.searchData.result.content;
    }, error => {
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
      this.imagesList = MockData.searchData.result.content;
      // console.log(allImages)
    })

  }


  getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  getSVGTemplate() {
    this.uploadCertificateService.getSvg(this.selectedCertificate.path).then(res => {
      this.svgFile = res;
      this.logoHtml = this.sanitizer.bypassSecurityTrustHtml(this.svgFile);
    })
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  createCertTemplate() {

  }

  onTemplateChange() {

  }

  searchImage() {
    this.uploadCertificateService.getAssetData(this.imageName).subscribe(res => {
      if (res && res.result) {
        this.imagesList = this.imageName ? MockData.searchSingleImage.result.content : MockData.searchData.result.content;
      }
    }, error => {
      console.log(error)
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
    })
  }

  async fileChange(ev) {
    const imageProperties = await this.getImageProperties(ev);
    console.log(imageProperties)
    if (imageProperties && imageProperties['size'] < 1) {
      this.fileObj = ev.target.files[0];
      const fileName = _.get(this.fileObj, 'name').split('.')[0];
      const userName = `${_.get(this.userService, 'userProfile.firstName')} ${_.get(this.userService, 'userProfile.lastName')}`
      this.uploadForm.patchValue({
        'assetCaption': fileName,
        'creator': userName,
        'creatorId': _.get(this.userService, 'userProfile.id')
      })
    }
  }

  getImageProperties(ev) {
    return new Promise((resolve, reject) => {
      let imageData;
      const file = ev.target.files[0];
      const img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        imageData = {
          'height': height,
          'width': width,
          'size': _.toNumber((file.size / (1024 * 1024)).toFixed(2)), //file.size,
          'type': file.type
        }
        console.log(imageData)
        resolve(imageData);
      }
    })
  }

  upload() {
    this.uploadCertificateService.createAsset(this.uploadForm.value).subscribe(res => {
      if (res && res.result) {
        this.uploadBlob(res);
      }
    }, error => {
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
      const createResponse = error.error;
      this.uploadBlob(createResponse);
    })
  }

  uploadBlob(data) {
    if (data) {
      const identifier = _.get(data, 'result.identifier');
      this.uploadCertificateService.storeAsset(this.fileObj, identifier).subscribe(imageData => {
        console.log('image data', imageData);
        this.showUploadUserModal = false;
        this.showSelectImageModal = false;
        const image = {
          'name': this.uploadForm.controls.assetCaption,
          'url': imageData.result.artifactUrl,
          'type': this.logoType
        }
        if (this.logoType === 'LOGO') {
          this.certLogos.push(image)
        } else {
          this.certSigns.push(image)
        }
      }, error => {
        this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
        const uploadedImageData = error.error;
        console.log(uploadedImageData)
        this.showUploadUserModal = false;
        this.showSelectImageModal = false;
        const image = {
          'name': this.uploadForm.controls.assetCaption.value,
          'url': uploadedImageData.result.artifactUrl,
          'type': this.logoType
        }
        if (this.logoType === 'LOGO') {
          this.certLogos.push(image)
        } else {
          this.certSigns.push(image)
        }
      })
    }
  }

  removeLogo(index) {
    this.certLogos.splice(index, 1)
  }

  removeSigns(index) {
    this.certSigns.splice(index, 1)
  }

  sclectLogo(logo) {
    this.selectedLogo = logo;
  }

  selectAndUseLogo() {
    this.showSelectImageModal = false;
    const image = {
      'name': this.selectedLogo.name,
      'url': this.selectedLogo.artifactUrl,
      'type': this.logoType
    }
    if (this.logoType === 'LOGO') {
      this.certLogos.push(image)
    } else {
      this.certSigns.push(image)
    }
  }

  openSateLogos(type) {
    this.logoType = type
    this.showSelectImageModal = true;
  }

  openSignLogos(type) {
    this.logoType = type;
    this.showSelectImageModal = true;
  }

  chooseCertificate(certificate) {
    this.selectedCertificate = certificate;
    this.getSVGTemplate();
  }

  convertHtml(tag) {
    const html = tag.toString();
    return new DOMParser().parseFromString(html, "text/html");
  }

  previewCertificate() {
    this.svgData = this.convertHtml(this.logoHtml)
    const logsArray = _.concat(this.certLogos, this.certSigns);
    logsArray.forEach((x, index) => {
      this.editSVG(x, index)
    })
    console.log(this.svgData.getElementsByTagName('svg')[0])
    this.certificateCreation(this.svgData.getElementsByTagName('svg')[0])
  }

  editSVG(data, index) {
    if (data) {
      console.log(data)
      let bottom = 75;
      if (data.type === 'SIGN') {
        bottom = 400
      }

      const left = (index + 1) * 100;
      let doc = this.svgData;
      console.log(this.svgData)
      let image = doc.createElement("image");
      image.setAttribute('xlink:href', data.url)
      image.setAttribute('id', index)
      image.setAttribute('x', (this.center + left))
      image.setAttribute('y', bottom)
      image.setAttribute('width', 100)
      image.setAttribute('height', 100)
      let element = doc.getElementById("Layer_1");
      element.appendChild(image);
    }
  }

  certificateCreation(ev) {
    console.log(ev)
    const url = this.getBase64Data(ev);
    const imageTag = document.getElementById('updatedSvg')
    if (imageTag) {
      imageTag.setAttribute('src', url)
    } else {
      const image = document.createElement('img');
      image.setAttribute('src', url)
      image.setAttribute('id', 'updatedSvg')
      // document.getElementById('imageSrc').appendChild(image)
    }
  }

  getBase64Data(ev) {
    const div = document.createElement('div');
    div.appendChild(ev.cloneNode(true));
    const b64 = 'data:image/svg+xml;base64,' + window.btoa(div.innerHTML);
    return b64;
  }
}