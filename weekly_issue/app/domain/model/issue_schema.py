from dataclasses import dataclass
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

@dataclass
class DataSchema:
    train: object
    test: object
    context: str
    fname: str
    id: str
    label: str
    
    @property
    def train(self) -> object:
        return self._train
    
    @train.setter
    def train(self,train):
        self._train = train

    @property
    def test(self) -> object:
        return self._test
    
    @test.setter
    def test(self,test):
        self._test = test

    @property
    def context(self) -> str:
        return self._context
    
    @context.setter
    def context(self,context):
        self._context = context

    @property
    def fname(self) -> str:
        return self._fname
    
    @fname.setter
    def fname(self,fname):
        self._fname = fname

    @property
    def id(self) -> str:
        return self._id
    
    @id.setter
    def id(self,id):
        self._id = id

    @property
    def label(self) -> str:
        return self._label
    
    @label.setter
    def label(self,label):
        self._label = label


# 오픈다트 API 관련 스키마
class DisclosureItem(BaseModel):
    company_name: str
    stock_code: str
    disclosure_title: str
    disclosure_date: str
    report_name: str

class DisclosureResponse(BaseModel):
    status: str
    message: str
    disclosures: List[DisclosureItem]
    total_count: int

class DartApiResponse(BaseModel):
    status: str
    message: str
    page_no: int
    page_count: int
    total_count: int
    total_page: int
    list: Optional[List[dict]]