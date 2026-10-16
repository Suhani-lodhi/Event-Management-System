import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';
import './Styles/FloatingImage.css';

// Import your downloaded images (adjust the path/filenames)
import img1 from './images/img1.jpeg';
import img2 from './images/img2.jpeg';
import img3 from './images/img3.jpeg';


const images = [img1, img2, img3];

// Loop mode needs more slides than slidesPerView, so repeat the list
const slides = [...images, ...images];

export default function FloatingImage() {
  return (
    <div className="floating-wrapper">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={3}
        spaceBetween={24}
        loop={true}
        speed={8000}                     
        autoplay={{
          delay: 0,                       
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        allowTouchMove={false}            
        breakpoints={{
          0:    { slidesPerView: 1.5 },
          600:  { slidesPerView: 2.5 },
          1024: { slidesPerView: 3.5 },
        }}
        className="floating-swiper"
      >
        {slides.map((src, i) => (
          <SwiperSlide key={i}>
            <img src={src} alt={`slide-${i}`} className="floating-img" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}