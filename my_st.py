import streamlit as st

#타이틀 텍스트 출력
st.title('첫번째 웹 어플 만들기😀👩🏻‍💻')

st.write('# 이것이 제목 :smile::sunglasses:')
'이것은 그냥 문자열'
st.write('## 이것이 부제목 :smile::sunglasses:')
st.write('### 이것이 소제목 :smile::sunglasses:')
st.write('#### 이것이 4단계 :smile::sunglasses:')
st.write('##### 이것이 5단계 :smile::sunglasses:')
st.write('###### 이것이 6단계 :smile::sunglasses:')
st.caption('이것이 캡션 :smile::sunglasses:')

st.divider() #구분선
'''
# 이것이 제목 :smile::sunglasses:
이것은 그냥 문자열  
### 지금부터 코드

```
import streamlit as st
import pandas
a = 3
b = 5
print(a+b)
```

## 이것이 부제목 :smile::sunglasses:
'''
456

st.divider() #구분선

'### with st.echo(): 코드와 결과를 같이 보여주는 블록'
with st.echo():
    #이 블록의 코드와 결과를 출력
    name = 'LeeSY'
    st.write('Hello, Streamlit! My name is', name)

st.divider() #구분선

r'''
### 마크다운에 수식 넣는 방법
- 본문에 포함  
$$E=mc^2$$  
$$\alpha + \beta = \gamma$$

### 마크다운 :yellow[작성법]
- ~지우기~
- **굵게**
- *기울임*
- ***굵고 기울임***
- > 인용문
- `코드`
1. 순서 있는 리스트
    1. 하위 리스트
    - 하위 리스트
1. :red[숫자랑 점만 입력해도] 순서 있는 리스트로 인식  
[링크 텍스트 네이버](https://www.naver.com)
'''