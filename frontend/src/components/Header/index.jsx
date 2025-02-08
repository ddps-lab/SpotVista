import styled from 'styled-components';

const Base = styled.div`
  height: 160px;
  width: 100%;
  background: #fff729;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  > img {
    width: 360px;
    user-drag: none;
    user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
`;

export default function Header() {
  return (
    <Base>
      <Content>
        <img src="/logo.svg" alt="sandevistan" />
      </Content>
    </Base>
  );
}
