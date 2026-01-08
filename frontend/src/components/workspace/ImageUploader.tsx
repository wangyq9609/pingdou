import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { loadImageFromFile } from '../../utils/imageProcessor';

const { Dragger } = Upload;

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoad }) => {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: async (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB！');
        return Upload.LIST_IGNORE;
      }

      try {
        const img = await loadImageFromFile(file);
        onImageLoad(img);
        message.success('图片加载成功！');
      } catch (error) {
        message.error('图片加载失败');
      }

      return false; // 阻止自动上传
    },
    showUploadList: false,
  };

  return (
    <Dragger {...uploadProps} className="!border-2 !border-dashed">
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域</p>
      <p className="ant-upload-hint">
        支持 JPG、PNG、GIF 等格式，文件大小不超过 10MB
      </p>
    </Dragger>
  );
};

export default ImageUploader;
