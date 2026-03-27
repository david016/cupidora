declare module 'react-native-deck-swiper' {
  import { Component } from 'react';

  interface OverlayLabelStyle {
    label?: object;
    wrapper?: object;
  }

  interface SwiperProps<T> {
    cards: T[];
    cardIndex?: number;
    renderCard: (card: T, index: number) => React.ReactNode;
    onSwiped?: (index: number) => void;
    onSwipedLeft?: (index: number) => void;
    onSwipedRight?: (index: number) => void;
    onSwipedTop?: (index: number) => void;
    onSwipedBottom?: (index: number) => void;
    onSwipedAll?: () => void;
    stackSize?: number;
    stackSeparation?: number;
    animateCardOpacity?: boolean;
    verticalSwipe?: boolean;
    horizontalSwipe?: boolean;
    backgroundColor?: string;
    cardVerticalMargin?: number;
    cardHorizontalMargin?: number;
    overlayLabels?: {
      left?: { title: string; style: OverlayLabelStyle };
      right?: { title: string; style: OverlayLabelStyle };
      top?: { title: string; style: OverlayLabelStyle };
      bottom?: { title: string; style: OverlayLabelStyle };
    };
    infinite?: boolean;
    showSecondCard?: boolean;
    swipeBackCard?: boolean;
  }

  export default class Swiper<T = any> extends Component<SwiperProps<T>> {
    swipeLeft(): void;
    swipeRight(): void;
    swipeTop(): void;
    swipeBottom(): void;
    swipeBack(): void;
  }
}
